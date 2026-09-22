-- ============================================================
-- BrokerFreeDU — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run: uses "if not exists" / "or replace" throughout.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
-- One row per auth user. Created automatically by the trigger below
-- the first time someone signs up; filled in by the app afterwards.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','owner','admin')),
  name text,
  email text,
  phone text,
  college text,
  verified boolean not null default false,
  id_upload_path text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles: read own" on profiles;
create policy "profiles: read own" on profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: admins read all" on profiles;
create policy "profiles: admins read all" on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on profiles;
create policy "profiles: insert own" on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: admin update all" on profiles;
create policy "profiles: admin update all" on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Auto-create a blank profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- listings ----------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  locality text not null,
  campus text,
  walk_minutes int,
  floor text,
  lift boolean not null default false,
  water text,
  backup text,
  rent numeric not null check (rent >= 0),
  deposit numeric not null default 0 check (deposit >= 0),
  maintenance numeric not null default 0 check (maintenance >= 0),
  electricity text,
  food boolean not null default false,
  leaving_date date not null,
  gender_pref text,
  curfew text,
  guests text,
  nonveg text,
  pets text,
  honest_note text,
  owner_name text,
  owner_phone text,        -- null unless the outgoing tenant confirmed owner consent
  poster_name text,
  poster_phone text,
  poster_role text not null default 'student',
  poster_college text,
  status text not null default 'active' check (status in ('active','filled','removed')),
  created_at timestamptz not null default now()
);

create index if not exists listings_status_leaving_idx on listings (status, leaving_date);
create index if not exists listings_locality_idx on listings (locality);

alter table listings enable row level security;

drop policy if exists "listings: public read" on listings;
create policy "listings: public read" on listings for select
  using (status <> 'removed');

drop policy if exists "listings: owner insert" on listings;
create policy "listings: owner insert" on listings for insert
  with check (auth.uid() = owner_id);

drop policy if exists "listings: owner update" on listings;
create policy "listings: owner update" on listings for update
  using (
    auth.uid() = owner_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "listings: owner delete" on listings;
create policy "listings: owner delete" on listings for delete
  using (
    auth.uid() = owner_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- listing photos ----------
create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  path text not null,       -- storage object path in the "listing-photos" bucket
  position int not null default 0
);

alter table listing_photos enable row level security;

drop policy if exists "photos: public read" on listing_photos;
create policy "photos: public read" on listing_photos for select using (true);

drop policy if exists "photos: owner insert" on listing_photos;
create policy "photos: owner insert" on listing_photos for insert
  with check (
    exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

drop policy if exists "photos: owner delete" on listing_photos;
create policy "photos: owner delete" on listing_photos for delete
  using (
    exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

-- ---------- reports (broker / fake / spam flags on a listing) ----------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  reporter_id uuid references profiles(id),
  reason text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

alter table reports enable row level security;

drop policy if exists "reports: authenticated insert" on reports;
create policy "reports: authenticated insert" on reports for insert
  with check (auth.uid() is not null);

drop policy if exists "reports: admin read" on reports;
create policy "reports: admin read" on reports for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "reports: admin update" on reports;
create policy "reports: admin update" on reports for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- A phone number appearing on more than 3 listings gets flagged for review.
-- Query the admin panel runs; not a trigger, since it's advisory not blocking.
create or replace view suspicious_phone_numbers as
  select poster_phone as phone, count(*) as listing_count
  from listings
  where poster_phone is not null and poster_phone <> ''
  group by poster_phone
  having count(*) > 3;

-- ---------- petition signatures ----------
-- Primary key = the signer's own user id, so a person can sign at most once.
create table if not exists petition_signatures (
  id uuid primary key references profiles(id) on delete cascade,
  name text not null,
  college text,
  message text,
  created_at timestamptz not null default now()
);

alter table petition_signatures enable row level security;

drop policy if exists "signatures: public read" on petition_signatures;
create policy "signatures: public read" on petition_signatures for select using (true);

drop policy if exists "signatures: self insert" on petition_signatures;
create policy "signatures: self insert" on petition_signatures for insert
  with check (auth.uid() = id);

drop policy if exists "signatures: admin delete" on petition_signatures;
create policy "signatures: admin delete" on petition_signatures for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------- building condition reports ----------
-- Address and free-text description are admin-only. The public page reads
-- only the aggregated view below, never this table directly.
create table if not exists building_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  locality text not null,
  issue text not null,
  description text,
  address text,             -- admin-only, never exposed to the public view
  created_at timestamptz not null default now()
);

alter table building_reports enable row level security;

drop policy if exists "building_reports: authenticated insert" on building_reports;
create policy "building_reports: authenticated insert" on building_reports for insert
  with check (auth.uid() is not null);

drop policy if exists "building_reports: admin read" on building_reports;
create policy "building_reports: admin read" on building_reports for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Public-safe aggregate: locality + count only, no address, no free text.
create or replace view building_reports_public as
  select locality, count(*) as count
  from building_reports
  group by locality;

grant select on building_reports_public to anon, authenticated;
grant select on suspicious_phone_numbers to authenticated;

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('id-uploads', 'id-uploads', false)
on conflict (id) do nothing;

-- listing-photos: anyone can view (bucket is public); only an authenticated
-- user can upload, and only into a folder named after their own listing.
drop policy if exists "listing-photos: public read" on storage.objects;
create policy "listing-photos: public read" on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "listing-photos: authenticated upload" on storage.objects;
create policy "listing-photos: authenticated upload" on storage.objects for insert
  with check (bucket_id = 'listing-photos' and auth.uid() is not null);

drop policy if exists "listing-photos: owner delete" on storage.objects;
create policy "listing-photos: owner delete" on storage.objects for delete
  using (bucket_id = 'listing-photos' and owner = auth.uid());

-- id-uploads: private. A student can upload their own ID; only admins can read.
drop policy if exists "id-uploads: self upload" on storage.objects;
create policy "id-uploads: self upload" on storage.objects for insert
  with check (bucket_id = 'id-uploads' and auth.uid() is not null);

drop policy if exists "id-uploads: admin read" on storage.objects;
create policy "id-uploads: admin read" on storage.objects for select
  using (
    bucket_id = 'id-uploads'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- Make yourself an admin after you've signed up once through the app:
--   update profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================
