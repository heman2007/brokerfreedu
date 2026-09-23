-- ============================================================
-- BrokerFreeDU — migration 1b
-- Catches up a database that was created before pending_signups was
-- added. Run this BEFORE migration_2.sql if you got:
--   ERROR: 42P01: relation "pending_signups" does not exist
-- Safe to re-run.
-- ============================================================

create table if not exists pending_signups (
  email text primary key,
  name text not null,
  college text,
  phone text,
  created_at timestamptz not null default now()
);

alter table pending_signups enable row level security;

drop policy if exists "pending: anyone insert" on pending_signups;
create policy "pending: anyone insert" on pending_signups for insert
  with check (true);

drop policy if exists "pending: read own email" on pending_signups;
create policy "pending: read own email" on pending_signups for select
  using (email = (auth.jwt() ->> 'email'));

drop policy if exists "pending: delete own email" on pending_signups;
create policy "pending: delete own email" on pending_signups for delete
  using (email = (auth.jwt() ->> 'email'));
