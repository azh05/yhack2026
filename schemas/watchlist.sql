-- Watchlist table — tracks which countries/regions a user watches
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS watchlist (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, country)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist (user_id);

-- RLS: users can only access their own watchlist rows
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service_role (server-side) full access
CREATE POLICY "Service role full access"
  ON watchlist FOR ALL
  USING (auth.role() = 'service_role');

-- Update email_subscribers to link to auth users
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
