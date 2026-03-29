-- AI briefings cache table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_briefings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country text NOT NULL UNIQUE,
  background text DEFAULT '',
  current_situation text DEFAULT '',
  humanitarian_impact text DEFAULT '',
  outlook text DEFAULT '',
  key_actors text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_briefings_country ON ai_briefings (country);

-- Public read access
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON ai_briefings FOR SELECT USING (true);
CREATE POLICY "Allow service write" ON ai_briefings FOR ALL USING (true);
