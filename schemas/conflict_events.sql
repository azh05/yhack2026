-- Conflict events table (sourced from ACLED)
-- Run this in your Supabase project's SQL editor.

create table conflict_events (
  id bigint generated always as identity primary key,
  event_id_cnty text unique not null,
  event_date date not null,
  event_type text not null,
  sub_event_type text,
  actor1 text,
  actor2 text,
  country text not null,
  admin1 text,
  admin2 text,
  latitude double precision not null,
  longitude double precision not null,
  fatalities integer default 0,
  notes text,
  source text,
  severity_score numeric(3,1),
  fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Spatial index for map queries
create index idx_conflict_events_geo on conflict_events (latitude, longitude);

-- Date index for timeline/timelapse
create index idx_conflict_events_date on conflict_events (event_date desc);

-- Country + date for region filtering
create index idx_conflict_events_country_date on conflict_events (country, event_date desc);

-- Event type filtering
create index idx_conflict_events_type on conflict_events (event_type);

-- Fast lookups by ACLED event id (used for upsert conflict resolution)
create index idx_conflict_events_acled_id on conflict_events (event_id_cnty);
