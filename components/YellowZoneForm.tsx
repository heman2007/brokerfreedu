"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function YellowZoneForm() {
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [ownerDetails, setOwnerDetails] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function submit() {
    setErr("");
    if (!placeName.trim() || !address.trim() || !reason.trim()) {
      return setErr("PG/flat name, address, and reason for concern are all needed.");
    }
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setErr("Sign in first.");
      return;
    }
    const { error } = await supabase.from("yellow_zone_requests").insert({
      reporter_id: user.id,
      place_name: placeName.trim(),
      address: address.trim(),
      reason: reason.trim(),
      owner_details: ownerDetails.trim() || null,
    });
    setBusy(false);
    if (error) setErr("Couldn't submit. Try again.");
    else {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return (
      <div className="notice-card rounded-sm p-5">
        <h3 className="font-semibold text-lg mb-1">Request filed.</h3>
        <p className="text-[14.5px] text-soft">
          It&apos;s in the queue for review. You&apos;ll see it move to &quot;audited&quot; here
          once it&apos;s been checked.
        </p>
      </div>
    );
  }

  return (
    <div className="notice-card rounded-sm p-5">
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">PG name, or flat location</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="e.g. Sharma PG, or 'flat near GTB Nagar metro'" />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Address</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Reason for concern</label>
        <textarea
          className="field-input w-full px-2.5 py-2 text-[15px] min-h-[92px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why does this need a safety check?"
        />
      </div>
      <div className="mb-4">
        <label className="block text-[13.5px] font-medium mb-1">Owner details (if known)</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={ownerDetails} onChange={(e) => setOwnerDetails(e.target.value)} placeholder="Name and/or phone" />
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
        {busy ? "Submitting…" : "Request an audit"}
      </button>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}
