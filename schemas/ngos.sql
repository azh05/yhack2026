-- NGO cache table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ngos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country text NOT NULL UNIQUE,
  ngos_json jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ngos_country ON ngos (country);

-- Public read access
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON ngos FOR SELECT USING (true);
CREATE POLICY "Allow service write" ON ngos FOR ALL USING (true);
