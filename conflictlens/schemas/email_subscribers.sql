-- Email subscribers table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/douraoyjdmhscwqmxfrg/sql

create table email_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  regions text[] default '{}',
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'instant')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for active subscriber lookups
create index idx_email_subscribers_active on email_subscribers (is_active) where is_active = true;

-- Index for frequency-based digest queries
create index idx_email_subscribers_frequency on email_subscribers (frequency) where is_active = true;

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger email_subscribers_updated_at
  before update on email_subscribers
  for each row
  execute function update_updated_at();
