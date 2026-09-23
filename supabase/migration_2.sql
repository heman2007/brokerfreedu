-- ============================================================
-- BrokerFreeDU — migration 2
-- Run this in Supabase SQL Editor AFTER schema.sql has already been run
-- once. Every statement is safe to re-run.
-- ============================================================

-- ---------- extended profile fields ----------
alter table profiles add column if not exists course text;
alter table profiles add column if not exists admission_year int;
alter table profiles add column if not exists area text;

alter table pending_signups add column if not exists course text;
alter table pending_signups add column if not exists admission_year int;
alter table pending_signups add column if not exists area text;

-- ---------- extended listing fields ----------
alter table listings add column if not exists address text;
alter table listings add column if not exists lat double precision;
alter table listings add column if not exists lng double precision;
alter table listings add column if not exists reason_leaving text;
alter table listings add column if not exists preferred_tenants text;
alter table listings add column if not exists poster_admission_year int;

-- listing_photos now carries video too, distinguished by "kind".
alter table listing_photos add column if not exists kind text not null default 'photo';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listing_photos_kind_check') then
    alter table listing_photos add constraint listing_photos_kind_check check (kind in ('photo','video'));
  end if;
end $$;

-- ---------- petition_signatures: drop the college text requirement ----------
-- (college now always comes from the signer's own profile at sign time,
-- the app no longer asks for it on the petition form itself — no schema
-- change needed here, "college" column stays and is filled from profiles.)

-- ---------- Danger Zone ----------
-- Per-property safety alert. Address, owner phone and exact coordinates
-- are admin-only — never exposed on the public page — for the same
-- defamation-risk reason the original building_reports table kept them
-- admin-only. Locality, description, rent, and media (photos/videos)
-- are public, since that's the actual warning signal for other students.
create table if not exists danger_zone_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  locality text not null,
  address text,               -- admin-only
  lat double precision,       -- admin-only
  lng double precision,       -- admin-only
  description text not null,
  owner_phone text,           -- admin-only
  rent numeric,
  currently_living boolean,
  status text not null default 'open' check (status in ('open','reviewed')),
  created_at timestamptz not null default now()
);

alter table danger_zone_reports enable row level security;

drop policy if exists "danger_zone: authenticated insert" on danger_zone_reports;
create policy "danger_zone: authenticated insert" on danger_zone_reports for insert
  with check (auth.uid() is not null);

drop policy if exists "danger_zone: admin read full" on danger_zone_reports;
create policy "danger_zone: admin read full" on danger_zone_reports for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "danger_zone: reporter read own" on danger_zone_reports;
create policy "danger_zone: reporter read own" on danger_zone_reports for select
  using (reporter_id = auth.uid());

drop policy if exists "danger_zone: admin update" on danger_zone_reports;
create policy "danger_zone: admin update" on danger_zone_reports for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Public-safe view: no address, no owner phone, no exact coordinates.
create or replace view danger_zone_public as
  select id, locality, description, rent, currently_living, status, created_at
  from danger_zone_reports;

grant select on danger_zone_public to anon, authenticated;

create table if not exists danger_zone_media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references danger_zone_reports(id) on delete cascade,
  path text not null,
  kind text not null default 'photo' check (kind in ('photo','video'))
);

alter table danger_zone_media enable row level security;

drop policy if exists "danger_zone_media: public read" on danger_zone_media;
create policy "danger_zone_media: public read" on danger_zone_media for select using (true);

drop policy if exists "danger_zone_media: authenticated insert" on danger_zone_media;
create policy "danger_zone_media: authenticated insert" on danger_zone_media for insert
  with check (
    exists (select 1 from danger_zone_reports r where r.id = report_id and r.reporter_id = auth.uid())
  );

-- ---------- Yellow Zone ----------
-- A request queue: students ask for a safety audit rather than reporting
-- one directly. Address and owner details are admin-only — the same
-- exposure reasoning as everywhere else. Only the audited-so-far COUNT
-- is public.
create table if not exists yellow_zone_requests (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  place_name text not null,
  address text not null,
  reason text not null,
  owner_details text,
  status text not null default 'requested' check (status in ('requested','in_progress','audited')),
  audited_at timestamptz,
  created_at timestamptz not null default now()
);

alter table yellow_zone_requests enable row level security;

drop policy if exists "yellow_zone: authenticated insert" on yellow_zone_requests;
create policy "yellow_zone: authenticated insert" on yellow_zone_requests for insert
  with check (auth.uid() is not null);

drop policy if exists "yellow_zone: admin read" on yellow_zone_requests;
create policy "yellow_zone: admin read" on yellow_zone_requests for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "yellow_zone: reporter read own" on yellow_zone_requests;
create policy "yellow_zone: reporter read own" on yellow_zone_requests for select
  using (reporter_id = auth.uid());

drop policy if exists "yellow_zone: admin update" on yellow_zone_requests;
create policy "yellow_zone: admin update" on yellow_zone_requests for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace view yellow_zone_audited_count as
  select count(*) as count from yellow_zone_requests where status = 'audited';

grant select on yellow_zone_audited_count to anon, authenticated;

-- ============================================================
-- Storage: a bucket for Danger Zone photos/videos (listing photos/videos
-- keep using the existing "listing-photos" bucket — a "kind" column
-- already distinguishes photo vs video within it).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('danger-zone-media', 'danger-zone-media', true)
on conflict (id) do nothing;

drop policy if exists "danger-zone-media: public read" on storage.objects;
create policy "danger-zone-media: public read" on storage.objects for select
  using (bucket_id = 'danger-zone-media');

drop policy if exists "danger-zone-media: authenticated upload" on storage.objects;
create policy "danger-zone-media: authenticated upload" on storage.objects for insert
  with check (bucket_id = 'danger-zone-media' and auth.uid() is not null);
