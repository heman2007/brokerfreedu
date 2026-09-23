# BrokerFreeDU

A free, no-commission platform for Delhi University students to post and find flats and PGs
directly — plus a petition for mandatory safety audits of buildings used as student housing.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Postgres, Auth, Storage)**,
deployed on **Vercel**. No payment flow anywhere in the product, on purpose.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project. Free tier is enough to start.
2. Once it's up, go to **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates every table, its
   row-level security policies, and the two storage buckets (`listing-photos`, public;
   `id-uploads`, private).
3. Then run [`supabase/migration_2.sql`](supabase/migration_2.sql) the same way — a second
   SQL Editor query. This adds the extended sign-up fields (course, admission year, area),
   video support on listings, and the Danger Zone / Yellow Zone tables and storage bucket.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret — it bypasses every
     RLS rule)

## 2. Turn on the sign-in methods

Go to **Authentication → Providers**:

- **Email** — should already be on. This is one of two ways students sign in (a magic link, no
  password). Under **Authentication → URL Configuration**, set:
  - Site URL: your deployed URL (e.g. `https://brokerfreedu.vercel.app`)
  - Redirect URLs: add `https://brokerfreedu.vercel.app/auth/callback` (and
    `http://localhost:3000/auth/callback` while developing)
- **Google** — the other student sign-in option. In Google Cloud Console, create an OAuth 2.0
  Client ID (Web application type), add `https://<your-project>.supabase.co/auth/v1/callback`
  as an authorized redirect URI, then paste the Client ID and Secret into Supabase's Google
  provider settings and toggle it on. **Domain restriction is enforced in the app's own code**
  (`app/auth/callback/route.ts` checks the signed-in email against `isDuEmail()` in
  `lib/types.ts` and force-signs-out anyone outside it) — Google's own `hd` parameter is only a
  UI hint and doesn't actually block other domains on its own, so don't rely on it alone.
- **Phone** — this is how owners sign in with an OTP over SMS. Supabase needs a real SMS
  provider wired in to send them: go to **Authentication → Providers → Phone**, turn it on, and
  connect **Twilio**, **MessageBird**, or **Vonage** (a small per-SMS cost, no free option).
  Until this is configured, the owner sign-up flow will error when it tries to send an OTP; the
  student flows work immediately since they don't need it.

**On the DU-domain check:** `isDuEmail()` auto-passes anything ending in `du.ac.in` (catches
`ss.du.ac.in`, `srcc.du.ac.in`, etc.), plus anything you add to the `KNOWN_DU_DOMAINS` array in
`lib/types.ts` for colleges on their own separate domain. Add confirmed ones there as you find
them — sign-up is a hard block for domains outside this list, per the current design.

## 3. Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the three Supabase values from step 1
npm run dev
```

Open `http://localhost:3000`.

## 4. Deploy

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo.
3. Add the same three environment variables from `.env.example` in Vercel's project settings
   (Settings → Environment Variables), plus `NEXT_PUBLIC_SITE_URL` set to your Vercel URL.
4. Deploy. Then go back to Supabase's URL Configuration (step 2) and make sure the Site URL and
   redirect URL match your real Vercel domain — magic links won't come back to the right place
   otherwise.

## 5. Make yourself an admin

Sign up once through the deployed site as a student (any email works for this step), then in
Supabase's SQL Editor run:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

Visit `/admin` on the deployed site. From there you can approve pending student ID
verifications, resolve or act on listing reports, see phone numbers appearing on 4+ listings
(the broker-detection signal), and read full building-condition reports including the address
that the public page never shows.

## How the pieces map to what's been built

| Feature | Where |
|---|---|
| Two account types, one profile table with a `role` | `supabase/schema.sql` (`profiles`), `components/AuthFlows.tsx` |
| Sign-up fields: name, college, course, admission year, area, DU email, private phone | `components/AuthFlows.tsx`, `components/CompleteProfile.tsx`, `migration_2.sql` |
| DU-domain-only sign-in (email + Google), hard block on other domains | `lib/types.ts` (`isDuEmail`, `KNOWN_DU_DOMAINS`), `app/auth/callback/route.ts` |
| Owner phone OTP | `components/AuthFlows.tsx` (`OwnerForm`) |
| Sign out visible in the header, not buried | `components/Header.tsx`, `components/SignOutButton.tsx` |
| Browsing/listings gated to signed-in users | `middleware.ts` (`PROTECTED_PREFIXES`) |
| Listing: address + pinpoint, photos/videos, reason for leaving, preferred tenants, direct owner phone | `components/PostForm.tsx` |
| Anonymous student byline ("Posted by a third year Hindu College student") | `lib/types.ts` (`yearOfStudyLabel`), `components/ListingCard.tsx`, `app/listing/[id]/page.tsx` |
| Broker/spam defenses (report button, phone-reuse flag) | `components/ListingDetailClient.tsx`, `suspicious_phone_numbers` view, `app/admin/page.tsx` |
| Petition — sign with just a name, college pulled from profile | `app/petition/page.tsx`, `components/PetitionForms.tsx` |
| Rent Control section | `app/petition/page.tsx` |
| Danger Zone — public per-property alerts, address/owner admin-only | `app/danger-zone/page.tsx`, `components/DangerZoneForm.tsx`, `danger_zone_public` view |
| Yellow Zone — audit request queue + public audited count | `app/yellow-zone/page.tsx`, `components/YellowZoneForm.tsx`, `yellow_zone_audited_count` view |
| Admin panel: verifications, listing reports, Danger Zone review, Yellow Zone status | `app/admin/page.tsx` |
| Satyagraha badge in header | `components/Header.tsx` — **placeholder text/photo, confirm with Deepanshu before shipping** |

## Known simplifications, worth knowing about

- **Pinpoint location** uses the browser's own GPS ("Use my current location"), not an
  interactive map picker — it only gives a good result if whoever's posting is standing at the
  property when they tap it. A real map-based picker (Leaflet + OpenStreetMap, free) is a
  reasonable next upgrade if the GPS approach turns out to be unreliable in practice.
- **`KNOWN_DU_DOMAINS`** in `lib/types.ts` starts empty. Every domain not ending in `du.ac.in`
  is currently rejected at sign-up — add specific ones here as you confirm a college uses an
  independent domain.
- **Video uploads** are capped at 40MB client-side and go straight into Supabase Storage with
  no compression — keep an eye on storage usage on the free tier once volume picks up.
- **The old `building_reports` table** from the first version of this app is still in the
  database (harmless, unused) — Danger Zone (`danger_zone_reports`) replaced it. Fine to ignore
  or drop later.

## Legal reminders (see also the footer and the safety notice on every listing)

- This platform never touches money and is not a party to any tenancy.
- Owner phone numbers are now collected and published directly with no in-app consent gate —
  this assumes permission is being handled outside the app, as decided. If that changes, the
  consent-checkbox pattern from the first version of `PostForm.tsx` is easy to bring back.
- Keep Danger Zone and Yellow Zone addresses/owner details admin-only, same reasoning as before:
  it's what keeps a student-run safety board from becoming a defamation liability.
