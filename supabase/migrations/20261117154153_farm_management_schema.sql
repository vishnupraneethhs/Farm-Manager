/*
# Farm Management - Core Schema

Single-tenant private farm management PWA. No auth required (offline-first,
role switching happens client-side). All CRUD open to anon + authenticated
since this is intentionally shared device data.

1. New Tables
- `crops` — Owner-managed crop list (name, variety, area, notes, active).
- `labor_logs` — Daily labor entries (male/female counts + rates, total, photo, date).
- `spray_logs` — Medicine spraying entries (crop_id, medicine, quantity, date).
- `expense_logs` — Other expenses (category, amount, notes, receipt photo, date).
- `crop_doctor_queries` — Saved AI queries (image, question, answer, status).

2. Sync columns
- Every log table has `local_id` (text, the Dexie client-side id) so sync is
  idempotent — same local row never duplicates in Supabase.
- `synced_at` tracks last successful push.

3. Security
- RLS enabled on all tables.
- CRUD granted to `anon, authenticated` (no-auth single-tenant app).
- Policies use `USING (true)` / `WITH CHECK (true)` — intentionally shared data
  on a private device; documented here per RLS rules.
*/

CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  name text NOT NULL,
  variety text,
  area_acres numeric,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS labor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  male_count integer NOT NULL DEFAULT 0,
  male_rate numeric NOT NULL DEFAULT 0,
  female_count integer NOT NULL DEFAULT 0,
  female_rate numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

CREATE TABLE IF NOT EXISTS spray_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  crop_id uuid REFERENCES crops(id) ON DELETE SET NULL,
  crop_name text NOT NULL,
  medicine_name text NOT NULL,
  quantity text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

CREATE TABLE IF NOT EXISTS expense_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  receipt_photo_url text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

CREATE TABLE IF NOT EXISTS crop_doctor_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  question text,
  image_url text,
  answer text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_doctor_queries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON crops TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON labor_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON spray_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expense_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crop_doctor_queries TO anon, authenticated;

DROP POLICY IF EXISTS "anon_rw_crops" ON crops;
CREATE POLICY "anon_rw_crops" ON crops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_crops" ON crops FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_crops" ON crops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crops" ON crops FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_rw_labor" ON labor_logs;
CREATE POLICY "anon_rw_labor" ON labor_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_labor" ON labor_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_labor" ON labor_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_labor" ON labor_logs FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_rw_spray" ON spray_logs;
CREATE POLICY "anon_rw_spray" ON spray_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_spray" ON spray_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_spray" ON spray_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_spray" ON spray_logs FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_rw_expense" ON expense_logs;
CREATE POLICY "anon_rw_expense" ON expense_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_expense" ON expense_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_expense" ON expense_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_expense" ON expense_logs FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_rw_doctor" ON crop_doctor_queries;
CREATE POLICY "anon_rw_doctor" ON crop_doctor_queries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_doctor" ON crop_doctor_queries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_doctor" ON crop_doctor_queries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_doctor" ON crop_doctor_queries FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_labor_logs_date ON labor_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_spray_logs_date ON spray_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_logs_date ON expense_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_doctor_date ON crop_doctor_queries(date DESC);