-- News articles cache table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/douraoyjdmhscwqmxfrg/sql

CREATE TABLE news_articles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country text NOT NULL,
  keyword text NOT NULL DEFAULT 'conflict',
  url text NOT NULL,
  title text NOT NULL,
  source text DEFAULT '',
  pub_date timestamptz,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE (country, url)
);

CREATE INDEX idx_news_country ON news_articles (country, fetched_at DESC);
