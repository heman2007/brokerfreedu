"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLLEGES } from "@/lib/types";

export default function CompleteProfile({ userId, email }: { userId: string; email: string | null }) {
  const [name, setName] = useState("");
  const [college, setCollege] = useState<string>(COLLEGES[0]);
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function save() {
    setErr("");
    if (!name.trim()) return setErr("Add your name to continue.");
    setBusy(true);
    const verified = !!email && /\.du\.ac\.in$/i.test(email.split("@")[1] ?? "");
    const { error } = await supabase
      .from("profiles")
      .update({ role: "student", name: name.trim(), college, phone: phone.trim(), verified })
      .eq("id", userId);
    setBusy(false);
    if (error) setErr("Couldn't save. Try again.");
    else {
      router.refresh();
    }
  }

  return (
    <div className="notice-card rounded-sm p-5 max-w-[500px]">
      <h3 className="font-semibold text-lg mb-1">Finish setting up your account</h3>
      <p className="text-[14.5px] text-soft mb-4">
        You&apos;re signed in{email ? ` as ${email}` : ""} — just add a couple of details to
        continue. If you meant to sign up as an owner instead, use the phone sign-in on the
        account page.
      </p>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Your name</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">College or department</label>
        <select className="field-input w-full px-2.5 py-2 text-[15px]" value={college} onChange={(e) => setCollege(e.target.value)}>
          {COLLEGES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-[13.5px] font-medium mb-1">Phone (shown on listings you post)</label>
        <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
      </div>
      <button onClick={save} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
        {busy ? "Saving…" : "Save and continue"}
      </button>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}