"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALITIES } from "@/lib/types";

type MediaItem = { file: File; kind: "photo" | "video"; previewUrl: string };

export default function DangerZoneForm() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [locality, setLocality] = useState<string>(LOCALITIES[0]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [description, setDescription] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [rent, setRent] = useState("");
  const [currentlyLiving, setCurrentlyLiving] = useState<string>("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function addFiles(files: FileList) {
    const room = 6 - media.length;
    Array.from(files)
      .slice(0, room)
      .forEach((f) => {
        const isVideo = f.type.startsWith("video/");
        setMedia((m) => [...m, { file: f, kind: isVideo ? "video" : "photo", previewUrl: URL.createObjectURL(f) }]);
      });
  }
  function removeMedia(i: number) {
    setMedia((m) => {
      URL.revokeObjectURL(m[i].previewUrl);
      return m.filter((_, idx) => idx !== i);
    });
  }

  function usePinpoint() {
    if (!navigator.geolocation) return setErr("Location isn't available on this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setErr("Couldn't get your location.");
      }
    );
  }

  async function submit() {
    setErr("");
    if (!description.trim()) return setErr("Describe what you've seen.");
    if (!address.trim()) return setErr("Add the address — this stays admin-only, never public.");
    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setErr("Sign in first.");
      return;
    }

    const { data: report, error: repErr } = await supabase
      .from("danger_zone_reports")
      .insert({
        reporter_id: user.id,
        locality,
        address: address.trim(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        description: description.trim(),
        owner_phone: ownerPhone.trim() || null,
        rent: rent ? Number(rent) : null,
        currently_living: currentlyLiving === "" ? null : currentlyLiving === "yes",
      })
      .select()
      .single();

    if (repErr || !report) {
      setBusy(false);
      setErr("Couldn't submit. Try again.");
      return;
    }

    for (const item of media) {
      const ext = item.file.name.split(".").pop() || (item.kind === "video" ? "mp4" : "jpg");
      const path = `${report.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("danger-zone-media").upload(path, item.file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("danger-zone-media").getPublicUrl(path);
        await supabase.from("danger_zone_media").insert({ report_id: report.id, path: pub.publicUrl, kind: item.kind });
      }
    }

    setBusy(false);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="notice-card rounded-sm p-5">
        <h3 className="font-semibold text-lg mb-1">Filed.</h3>
        <p className="text-[14.5px] text-soft">
          The address and owner number stay admin-only. The description, photos/videos and
          locality now show up in the public list below.
        </p>
      </div>
    );
  }

  return (
    <div className="notice-card rounded-sm p-5">
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Locality</label>
        <select className="field-input w-full px-2.5 py-2 text-[15px]" value={locality} onChange={(e) => setLocality(e.target.value)}>
          {LOCALITIES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Address (admin-only, never published)</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Building and street" />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Pinpoint (optional, admin-only)</label>
        <div className="flex gap-2 items-center flex-wrap">
          <button type="button" onClick={usePinpoint} disabled={locating} className="btn-ghost px-3 py-2 text-sm font-semibold rounded-sm">
            {locating ? "Getting location…" : "Use my current location"}
          </button>
          {lat && lng && <span className="text-[13.5px] text-soft">Pinned: {lat}, {lng}</span>}
        </div>
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Photos / videos</label>
        <input type="file" accept="image/*,video/*" multiple onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <div className="flex flex-wrap gap-2 mt-2.5">
          {media.map((m, i) => (
            <div key={i} className="relative">
              {m.kind === "video" ? (
                <video src={m.previewUrl} className="w-[96px] h-[72px] object-cover border-[1.5px] border-rule" muted />
              ) : (
                <img src={m.previewUrl} alt="" className="w-[78px] h-[60px] object-cover border-[1.5px] border-rule" />
              )}
              <button onClick={() => removeMedia(i)} className="absolute -top-1.5 -right-1.5 bg-ink text-paper rounded-full w-[21px] h-[21px] text-[13px] leading-none">×</button>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Description</label>
        <textarea
          className="field-input w-full px-2.5 py-2 text-[15px] min-h-[92px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the condition — cracks, wiring, exits, structure. Describe the building, not the owner."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-[13.5px] font-medium mb-1">Owner's phone (admin-only)</label>
          <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-[13.5px] font-medium mb-1">Rent (if known)</label>
          <input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={rent} onChange={(e) => setRent(e.target.value)} />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-[13.5px] font-medium mb-1">Are you staying there?</label>
        <select className="field-input w-full px-2.5 py-2 text-[15px]" value={currentlyLiving} onChange={(e) => setCurrentlyLiving(e.target.value)}>
          <option value="">Prefer not to say</option>
          <option value="yes">Yes, currently living there</option>
          <option value="no">No, moved out / never lived there</option>
        </select>
      </div>
      <button onClick={submit} disabled={busy} className="btn-red px-5 py-2.5 font-semibold rounded-sm">
        {busy ? "Submitting…" : "Submit Danger Zone alert"}
      </button>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}
