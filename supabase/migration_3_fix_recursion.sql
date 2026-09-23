-- ============================================================
-- BrokerFreeDU — migration 3
-- Fixes: "infinite recursion detected in policy for relation profiles"
--
-- Every policy that checked "is this user an admin?" did so by querying
-- profiles from within a profiles policy itself — Postgres can re-trigger
-- that same policy on itself, recursing. This has been silently breaking
-- EVERY profile save since the admin-update policy was added: sign-up,
-- login profile completion, and the callback route were all failing.
--
-- Fix: move the admin check into a SECURITY DEFINER function, which runs
-- with elevated privileges and bypasses RLS on its own internal query,
-- breaking the recursion. Every affected policy is redefined to call it.
-- Safe to re-run.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- profiles ----------
drop policy if exists "profiles: admins read all" on profiles;
create policy "profiles: admins read all" on profiles for select
  using (public.is_admin());

drop policy if exists "profiles: admin update all" on profiles;
create policy "profiles: admin update all" on profiles for update
  using (public.is_admin());

-- ---------- listings ----------
drop policy if exists "listings: owner update" on listings;
create policy "listings: owner update" on listings for update
  using (auth.uid() = owner_id or public.is_admin());

drop policy if exists "listings: owner delete" on listings;
create policy "listings: owner delete" on listings for delete
  using (auth.uid() = owner_id or public.is_admin());

-- ---------- reports ----------
drop policy if exists "reports: admin read" on reports;
create policy "reports: admin read" on reports for select
  using (public.is_admin());

drop policy if exists "reports: admin update" on reports;
create policy "reports: admin update" on reports for update
  using (public.is_admin());

-- ---------- petition_signatures ----------
drop policy if exists "signatures: admin delete" on petition_signatures;
create policy "signatures: admin delete" on petition_signatures for delete
  using (public.is_admin());

-- ---------- building_reports (legacy, harmless if unused) ----------
drop policy if exists "building_reports: admin read" on building_reports;
create policy "building_reports: admin read" on building_reports for select
  using (public.is_admin());

-- ---------- id-uploads storage ----------
drop policy if exists "id-uploads: admin read" on storage.objects;
create policy "id-uploads: admin read" on storage.objects for select
  using (bucket_id = 'id-uploads' and public.is_admin());

-- ---------- danger_zone_reports ----------
drop policy if exists "danger_zone: admin read full" on danger_zone_reports;
create policy "danger_zone: admin read full" on danger_zone_reports for select
  using (public.is_admin());

drop policy if exists "danger_zone: admin update" on danger_zone_reports;
create policy "danger_zone: admin update" on danger_zone_reports for update
  using (public.is_admin());

-- ---------- yellow_zone_requests ----------
drop policy if exists "yellow_zone: admin read" on yellow_zone_requests;
create policy "yellow_zone: admin read" on yellow_zone_requests for select
  using (public.is_admin());

drop policy if exists "yellow_zone: admin update" on yellow_zone_requests;
create policy "yellow_zone: admin update" on yellow_zone_requests for update
  using (public.is_admin());
