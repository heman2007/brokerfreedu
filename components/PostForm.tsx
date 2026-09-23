"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALITIES, LISTING_TYPES, type Profile } from "@/lib/types";

type MediaItem = { file: File; kind: "photo" | "video"; previewUrl: string };
const MAX_VIDEO_MB = 40;

export default function PostForm({ profile, userId }: { profile: Profile; userId: string }) {
  const isOwner = profile.role === "owner";
  const router = useRouter();
  const supabase = createClient();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [type, setType] = useState<string>(LISTING_TYPES[0]);
  const [locality, setLocality] = useState<string>(LOCALITIES[0]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [maint, setMaint] = useState("");
  const [leaving, setLeaving] = useState("");
  const [reasonLeaving, setReasonLeaving] = useState("");
  const [preferredTenants, setPreferredTenants] = useState("");
  const [oPhone, setOPhone] = useState(isOwner ? profile.phone ?? "" : "");
  const [oName, setOName] = useState(isOwner ? profile.name ?? "" : "");
  const [myPhone, setMyPhone] = useState(isOwner ? "" : profile.phone ?? "");
  const [honest, setHonest] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function addFiles(files: FileList) {
    const room = 6 - media.length;
    const next = Array.from(files).slice(0, room);
    for (const f of next) {
      const isVideo = f.type.startsWith("video/");
      if (isVideo && f.size > MAX_VIDEO_MB * 1024 * 1024) {
        setErr(`${f.name} is over ${MAX_VIDEO_MB}MB — trim it or pick a shorter clip.`);
        continue;
      }
      setMedia((m) => [...m, { file: f, kind: isVideo ? "video" : "photo", previewUrl: URL.createObjectURL(f) }]);
    }
  }
  function removeMedia(i: number) {
    setMedia((m) => {
      URL.revokeObjectURL(m[i].previewUrl);
      return m.filter((_, idx) => idx !== i);
    });
  }

  function usePinpoint() {
    if (!navigator.geolocation) {
      setErr("Location isn't available on this browser — enter coordinates manually if you have them.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setErr("Couldn't get your location — check location permission, or enter coordinates manually.");
      }
    );
  }

  async function submit() {
    setErr("");
    if (media.length === 0) return setErr("Add at least one photo. Three is better.");
    if (!address.trim()) return setErr("Add the address.");
    if (!rent) return setErr("Rent is required.");
    if (!deposit) return setErr("Security deposit is required — it's the number people get burned on.");
    if (!leaving) return setErr("The date of leaving is the whole point. Add it.");
    if (!oPhone.trim()) return setErr("Add the owner's phone number.");
    if (isOwner && !oName.trim()) return setErr("Add your name.");

    setBusy(true);

    const { data: listing, error: listErr } = await supabase
      .from("listings")
      .insert({
        owner_id: userId,
        type,
        locality,
        address: address.trim(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        rent: Number(rent),
        deposit: Number(deposit),
        maintenance: maint ? Number(maint) : 0,
        leaving_date: leaving,
        reason_leaving: reasonLeaving.trim() || null,
        preferred_tenants: preferredTenants.trim() || null,
        honest_note: isOwner ? null : honest.trim() || null,
        owner_name: oName.trim() || null,
        owner_phone: oPhone.trim(),
        poster_name: profile.name,
        poster_phone: isOwner ? oPhone.trim() : myPhone.trim() || null,
        poster_role: profile.role,
        poster_college: profile.college,
        poster_admission_year: profile.admission_year,
        status: "active",
      })
      .select()
      .single();

    if (listErr || !listing) {
      setBusy(false);
      setErr("Couldn't publish. Try again in a moment.");
      return;
    }

    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      const ext = item.file.name.split(".").pop() || (item.kind === "video" ? "mp4" : "jpg");
      const path = `${listing.id}/${i}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, item.file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
        await supabase
          .from("listing_photos")
          .insert({ listing_id: listing.id, path: pub.publicUrl, position: i, kind: item.kind });
      }
    }

    setBusy(false);
    router.push(`/listing/${listing.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-[660px]">
      <h2 className="text-[26px] font-bold tracking-tight mb-2">
        {isOwner ? "Post a vacancy" : "Post the flat you're leaving"}
      </h2>
      <p className="text-[17.5px] text-soft max-w-[60ch] mb-7">
        Four honest photos beat forty polished ones. A short video walkthrough is even better —
        students say the room, the bathroom, the kitchen and the building entrance are what they
        got lied to about.
      </p>

      {!isOwner && (
        <div className="notice-card rounded-sm p-3.5 text-[14px] mb-5">
          This goes up anonymously — students see it as &quot;Posted by a {"{year}"} {profile.college || "your college"} student,&quot; never your name.
        </div>
      )}

      <Fieldset title="Photos and videos">
        <input type="file" accept="image/*,video/*" multiple onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <p className="text-[13px] text-soft mt-1">Up to 6 files. Videos capped at {MAX_VIDEO_MB}MB each.</p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {media.map((m, i) => (
            <div key={i} className="relative">
              {m.kind === "video" ? (
                <video src={m.previewUrl} className="w-[96px] h-[72px] object-cover border-[1.5px] border-rule" muted />
              ) : (
                <img src={m.previewUrl} alt="" className="w-[78px] h-[60px] object-cover border-[1.5px] border-rule" />
              )}
              <button
                onClick={() => removeMedia(i)}
                className="absolute -top-1.5 -right-1.5 bg-ink text-paper rounded-full w-[21px] h-[21px] text-[13px] leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </Fieldset>

      <Fieldset title="The place">
        <Row2>
          <Field label="Type">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={type} onChange={(e) => setType(e.target.value)}>
              {LISTING_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Locality">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={locality} onChange={(e) => setLocality(e.target.value)}>
              {LOCALITIES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </Row2>
        <Field label="Address">
          <input className="field-input w-full px-2.5 py-2 text-[15px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House/flat number, street" />
        </Field>
        <Field label="Pinpoint location (optional but helpful)">
          <div className="flex gap-2 items-center flex-wrap">
            <button type="button" onClick={usePinpoint} disabled={locating} className="btn-ghost px-3 py-2 text-sm font-semibold rounded-sm">
              {locating ? "Getting location…" : "Use my current location"}
            </button>
            {lat && lng && <span className="text-[13.5px] text-soft">Pinned: {lat}, {lng}</span>}
          </div>
          <p className="text-[13px] text-soft mt-1">
            Only works accurately if you&apos;re standing at the flat when you tap it — otherwise leave it blank.
          </p>
        </Field>
      </Fieldset>

      <Fieldset title="What it actually costs">
        <p className="text-[13px] text-soft -mt-1 mb-3">Break it out. A single blended number is how people get surprised in month two.</p>
        <Row3>
          <Field label="Rent per month (₹)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="11000" /></Field>
          <Field label="Security deposit (₹)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="22000" /></Field>
          <Field label="Maintenance (₹/mo)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={maint} onChange={(e) => setMaint(e.target.value)} placeholder="0" /></Field>
        </Row3>
      </Fieldset>

      <Fieldset title="When it opens up, and why">
        <Field label="Date of leaving / available from">
          <input type="date" className="field-input w-full px-2.5 py-2 text-[15px]" value={leaving} onChange={(e) => setLeaving(e.target.value)} />
        </Field>
        {!isOwner && (
          <Field label="Reason for leaving">
            <input className="field-input w-full px-2.5 py-2 text-[15px]" value={reasonLeaving} onChange={(e) => setReasonLeaving(e.target.value)} placeholder="Graduating, switching PGs, going home for the semester…" />
          </Field>
        )}
        <Field label="Preferred tenants (optional)">
          <input className="field-input w-full px-2.5 py-2 text-[15px]" value={preferredTenants} onChange={(e) => setPreferredTenants(e.target.value)} placeholder="e.g. girls only, non-smokers, quiet hours" />
        </Field>
      </Fieldset>

      {!isOwner && (
        <Fieldset title="What you wish you'd known">
          <textarea
            className="field-input w-full px-2.5 py-2 text-[15px] min-h-[92px]"
            value={honest}
            onChange={(e) => setHonest(e.target.value)}
            placeholder="Seepage in the monsoon, the landlord's actual response time, how the deposit came back, the 6 am construction next door — one honest paragraph."
          />
        </Fieldset>
      )}

      <Fieldset title="Contact">
        <Row2>
          <Field label={isOwner ? "Your name" : "Owner's name"}>
            <input className="field-input w-full px-2.5 py-2 text-[15px]" value={oName} onChange={(e) => setOName(e.target.value)} placeholder={isOwner ? "Full name" : "As they introduce themselves"} />
          </Field>
          <Field label={isOwner ? "Your phone" : "Owner's phone"}>
            <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={oPhone} onChange={(e) => setOPhone(e.target.value)} placeholder="10-digit number" />
          </Field>
        </Row2>
        {!isOwner && (
          <Field label="Your own number (optional backup contact, also private otherwise)">
            <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={myPhone} onChange={(e) => setMyPhone(e.target.value)} />
          </Field>
        )}
      </Fieldset>

      <div className="notice-card rounded-sm p-3.5 text-[14.5px] mb-5">
        This listing expires 45 days after the date of leaving unless you extend it.
      </div>

      <div className="flex gap-3">
        <button onClick={submit} disabled={busy} className="btn-primary px-5 py-3 font-semibold rounded-sm">
          {busy ? "Publishing…" : "Publish this listing"}
        </button>
      </div>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="notice-card rounded-sm p-5 mb-5">
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">{children}</div>;
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[13.5px] font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
