/*
# Add income_logs table

New table for daily crop income entries. Both Owner and Manager can record
income per crop with an optional bill photograph.

1. New Table
- `income_logs` — daily income (date, crop_id, crop_name, amount, bill_photo, notes)
- `local_id` text UNIQUE for idempotent offline sync

2. Security
- RLS enabled, CRUD open to anon + authenticated (single-tenant, no-auth app).
*/

CREATE TABLE IF NOT EXISTS income_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  crop_id uuid REFERENCES crops(id) ON DELETE SET NULL,
  crop_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  bill_photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
);

ALTER TABLE income_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON income_logs TO anon, authenticated;

DROP POLICY IF EXISTS "anon_rw_income" ON income_logs;
CREATE POLICY "anon_rw_income" ON income_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_income" ON income_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_income" ON income_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_income" ON income_logs FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_income_logs_date ON income_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_income_logs_crop ON income_logs(crop_name);