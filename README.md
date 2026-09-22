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
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret — it bypasses every
     RLS rule)

## 2. Turn on the two sign-in methods

Go to **Authentication → Providers**:

- **Email** — should already be on. This is how students sign in (a magic link, no password).
  Under **Authentication → URL Configuration**, set:
  - Site URL: your deployed URL (e.g. `https://brokerfreedu.vercel.app`)
  - Redirect URLs: add `https://brokerfreedu.vercel.app/auth/callback` (and
    `http://localhost:3000/auth/callback` while developing)
- **Phone** — this is how owners sign in with an OTP over SMS. Supabase needs a real SMS
  provider wired in to send them: go to **Authentication → Providers → Phone**, turn it on, and
  connect **Twilio**, **MessageBird**, or **Vonage** (you'll need an account and a small budget
  with one of these — none are free, since SMS costs money per message). Until this is
  configured, the owner sign-up flow will show an error when it tries to send an OTP; the
  student flow works immediately since it only needs email.

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

## How the pieces map to the build brief

| Feature | Where |
|---|---|
| Two account types, one profile table with a `role` | `supabase/schema.sql` (`profiles`), `components/AuthFlows.tsx` |
| Student verification (`.du.ac.in` auto, else manual ID review) | `app/auth/callback/route.ts`, `components/IdUpload.tsx`, `app/admin/page.tsx` |
| Owner phone OTP | `components/AuthFlows.tsx` (`OwnerForm`) |
| Listing with date-of-leaving as the headline field | `components/PostForm.tsx`, `app/listing/[id]/page.tsx` |
| Owner-consent gate on publishing a phone number | `components/PostForm.tsx` (the two checkboxes) |
| Broker/spam defenses (report button, phone-reuse flag) | `components/ListingDetailClient.tsx`, `suspicious_phone_numbers` view in `schema.sql`, `app/admin/page.tsx` |
| Browse/filter/sort by locality, rent, type, date | `app/browse/page.tsx`, `components/Filters.tsx` |
| Petition with one-signature-per-person | `app/petition/page.tsx`, `petition_signatures` table (primary key = user id) |
| Building reports public as locality counts only | `building_reports_public` view in `schema.sql` — the base table with addresses is admin-only |

## What's intentionally out of this version

Per the build order in the original brief, items 6–8 (saved-search alerts, map view) are not
built yet — the admin panel (item 6) is included since it's load-bearing for moderation from
day one. No messaging threads yet either; the fastest safe path in v1 is showing contact details
directly, same as the brief's fallback.

## Legal reminders (see also the footer and the safety notice on every listing)

- This platform never touches money and is not a party to any tenancy.
- Publishing a phone number without consent is a real exposure under India's Digital Personal
  Data Protection Act, 2023 — don't remove the consent gate in the post form.
- Keep building-condition reports aggregated by locality on the public page. Never expose
  addresses or names outside the admin panel; that's what invites defamation claims against a
  student-run site.
