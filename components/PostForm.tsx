"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALITIES, LISTING_TYPES, type Profile } from "@/lib/types";

export default function PostForm({ profile, userId }: { profile: Profile; userId: string }) {
  const isOwner = profile.role === "owner";
  const router = useRouter();
  const supabase = createClient();

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [type, setType] = useState<string>(LISTING_TYPES[0]);
  const [locality, setLocality] = useState<string>(LOCALITIES[0]);
  const [campus, setCampus] = useState("North Campus");
  const [walk, setWalk] = useState("");
  const [floor, setFloor] = useState("");
  const [lift, setLift] = useState(false);
  const [water, setWater] = useState("Municipal, regular");
  const [backup, setBackup] = useState("no");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [maint, setMaint] = useState("");
  const [electricity, setElectricity] = useState("Sub-meter, actual units");
  const [food, setFood] = useState(false);
  const [leaving, setLeaving] = useState("");
  const [gender, setGender] = useState("Any");
  const [curfew, setCurfew] = useState("");
  const [guests, setGuests] = useState("");
  const [nonveg, setNonveg] = useState("");
  const [pets, setPets] = useState("");
  const [honest, setHonest] = useState("");
  const [oName, setOName] = useState(isOwner ? profile.name ?? "" : "");
  const [oPhone, setOPhone] = useState(isOwner ? profile.phone ?? "" : "");
  const [myPhone, setMyPhone] = useState(profile.phone ?? "");
  const [consent, setConsent] = useState(false);
  const [noConsent, setNoConsent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function addPhotos(files: FileList) {
    const room = 4 - photos.length;
    const next = Array.from(files).slice(0, room);
    setPhotos((p) => [...p, ...next]);
    next.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setPreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  }
  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setErr("");
    if (photos.length === 0) return setErr("Add at least one photo. Three is better.");
    if (!rent) return setErr("Rent is required.");
    if (!deposit) return setErr("Security deposit is required — it's the number people get burned on.");
    if (!leaving) return setErr("The date of leaving is the whole point. Add it.");

    let ownerPhoneFinal = oPhone.trim();
    let posterPhoneFinal = isOwner ? oPhone.trim() : myPhone.trim();

    if (!isOwner) {
      if (consent === noConsent) return setErr("Tick exactly one of the two consent boxes about the owner's number.");
      if (noConsent) ownerPhoneFinal = "";
      if (consent && !ownerPhoneFinal) return setErr("Add the owner's number, or tick the second box.");
      if (!posterPhoneFinal) return setErr("Add your own contact number so students can reach you.");
    } else if (!ownerPhoneFinal) {
      return setErr("Add your phone number.");
    }

    setBusy(true);

    const { data: listing, error: listErr } = await supabase
      .from("listings")
      .insert({
        owner_id: userId,
        type,
        locality,
        campus,
        walk_minutes: walk ? Number(walk) : null,
        floor,
        lift,
        water,
        backup,
        rent: Number(rent),
        deposit: Number(deposit),
        maintenance: maint ? Number(maint) : 0,
        electricity,
        food,
        leaving_date: leaving,
        gender_pref: gender,
        curfew,
        guests,
        nonveg,
        pets,
        honest_note: isOwner ? null : honest,
        owner_name: oName,
        owner_phone: ownerPhoneFinal || null,
        poster_name: profile.name,
        poster_phone: posterPhoneFinal,
        poster_role: profile.role,
        poster_college: profile.college,
        status: "active",
      })
      .select()
      .single();

    if (listErr || !listing) {
      setBusy(false);
      setErr("Couldn't publish. Try again in a moment.");
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const path = `${listing.id}/${i}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
        await supabase.from("listing_photos").insert({ listing_id: listing.id, path: pub.publicUrl, position: i });
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
        Four honest photos beat forty polished ones. Students say the room, the bathroom, the
        kitchen and the building entrance are what they got lied to about.
      </p>

      <Fieldset title="Photos">
        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && addPhotos(e.target.files)} />
        <p className="text-[13px] text-soft mt-1">Up to 4 photos.</p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-[78px] h-[60px] object-cover border-[1.5px] border-rule" />
              <button
                onClick={() => removePhoto(i)}
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
        <Row3>
          <Field label="Nearest campus">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={campus} onChange={(e) => setCampus(e.target.value)}>
              <option>North Campus</option><option>South Campus</option><option>Off-campus department</option>
            </select>
          </Field>
          <Field label="Walk to campus (min)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={walk} onChange={(e) => setWalk(e.target.value)} placeholder="12" /></Field>
          <Field label="Floor"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="2" /></Field>
        </Row3>
        <Row3>
          <Field label="Lift">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={lift ? "yes" : "no"} onChange={(e) => setLift(e.target.value === "yes")}>
              <option value="no">No lift</option><option value="yes">Lift</option>
            </select>
          </Field>
          <Field label="Water supply">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={water} onChange={(e) => setWater(e.target.value)}>
              <option>Municipal, regular</option><option>Borewell/tanker</option><option>Irregular</option>
            </select>
          </Field>
          <Field label="Power backup">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={backup} onChange={(e) => setBackup(e.target.value)}>
              <option value="no">None</option><option value="inverter">Inverter</option><option value="generator">Generator</option>
            </select>
          </Field>
        </Row3>
      </Fieldset>

      <Fieldset title="What it actually costs">
        <p className="text-[13px] text-soft -mt-1 mb-3">Break it out. A single blended number is how people get surprised in month two.</p>
        <Row3>
          <Field label="Rent per month (₹)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="11000" /></Field>
          <Field label="Security deposit (₹)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="22000" /></Field>
          <Field label="Maintenance (₹/mo)"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={maint} onChange={(e) => setMaint(e.target.value)} placeholder="0" /></Field>
        </Row3>
        <Row2>
          <Field label="Electricity billed as">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={electricity} onChange={(e) => setElectricity(e.target.value)}>
              <option>Sub-meter, actual units</option><option>Fixed monthly amount</option><option>Shared and split</option>
            </select>
          </Field>
          <Field label="Food included">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={food ? "yes" : "no"} onChange={(e) => setFood(e.target.value === "yes")}>
              <option value="no">No</option><option value="yes">Yes (PG mess)</option>
            </select>
          </Field>
        </Row2>
      </Fieldset>

      <Fieldset title="When it opens up">
        <Field label="Date of leaving / available from">
          <input type="date" className="field-input w-full px-2.5 py-2 text-[15px]" value={leaving} onChange={(e) => setLeaving(e.target.value)} />
        </Field>
        <p className="text-[13px] text-soft">This is the field the whole site is built on. Post it as soon as you know it.</p>
      </Fieldset>

      <Fieldset title="Who it's for, and the rules">
        <Row2>
          <Field label="Landlord's preference">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option>Any</option><option>Girls only</option><option>Boys only</option>
            </select>
          </Field>
          <Field label="Curfew"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={curfew} onChange={(e) => setCurfew(e.target.value)} placeholder="e.g. 10:30 pm, or none" /></Field>
        </Row2>
        <Row3>
          <Field label="Guests">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option value="">Not stated</option><option value="yes">Allowed</option><option value="no">Not allowed</option>
            </select>
          </Field>
          <Field label="Non-veg">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={nonveg} onChange={(e) => setNonveg(e.target.value)}>
              <option value="">Not stated</option><option value="yes">Allowed</option><option value="no">Not allowed</option>
            </select>
          </Field>
          <Field label="Pets">
            <select className="field-input w-full px-2.5 py-2 text-[15px]" value={pets} onChange={(e) => setPets(e.target.value)}>
              <option value="">Not stated</option><option value="yes">Allowed</option><option value="no">Not allowed</option>
            </select>
          </Field>
        </Row3>
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
        {isOwner ? (
          <Row2>
            <Field label="Your name"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={oName} onChange={(e) => setOName(e.target.value)} /></Field>
            <Field label="Your phone"><input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={oPhone} onChange={(e) => setOPhone(e.target.value)} /></Field>
          </Row2>
        ) : (
          <>
            <Row2>
              <Field label="Owner's name"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={oName} onChange={(e) => setOName(e.target.value)} placeholder="As they introduce themselves" /></Field>
              <Field label="Owner's phone"><input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={oPhone} onChange={(e) => setOPhone(e.target.value)} placeholder="10-digit number" /></Field>
            </Row2>
            <label className="flex gap-2.5 items-start text-[14.5px] mb-3">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>The owner knows I&apos;m listing this and has agreed to be contacted by students through this site.</span>
            </label>
            <label className="flex gap-2.5 items-start text-[14.5px] mb-3">
              <input type="checkbox" className="mt-1" checked={noConsent} onChange={(e) => setNoConsent(e.target.checked)} />
              <span>The owner hasn&apos;t agreed. Publish without their number and send all enquiries to me instead.</span>
            </label>
            <p className="text-[13px] text-soft mb-3">
              Publishing someone&apos;s phone number without their consent is a real legal problem
              under India&apos;s data protection law. One of these two boxes is required.
            </p>
            <Row2>
              <Field label="Your own contact (shown either way)"><input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={myPhone} onChange={(e) => setMyPhone(e.target.value)} /></Field>
            </Row2>
          </>
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
