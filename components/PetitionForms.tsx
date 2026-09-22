"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLLEGES, LOCALITIES } from "@/lib/types";

export function SignForm({ alreadySigned, defaultCollege }: { alreadySigned: boolean; defaultCollege?: string | null }) {
  const [name, setName] = useState("");
  const [college, setCollege] = useState(defaultCollege || COLLEGES[0]);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function sign() {
    setErr("");
    if (!name.trim()) return setErr("Add your name — an unsigned count is worth nothing.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setErr("Sign in on the account page first, so each signature is one real person.");
      return;
    }
    const { error } = await supabase
      .from("petition_signatures")
      .insert({ id: user.id, name: name.trim(), college, message: message.trim() || null });
    setBusy(false);
    if (error) setErr("Couldn't record your signature.");
    else {
      router.refresh();
    }
  }

  async function share() {
    const text =
      "DU students are asking for mandatory structural safety audits of buildings used as student housing. Delhi retires a car at 15 years — not the building you sleep in.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "BrokerFreeDU petition", text, url: location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      alert("Link copied.");
    }
  }

  if (alreadySigned) {
    return (
      <div>
        <p className="font-semibold mt-3">You&apos;ve signed this. Thanks.</p>
        <button onClick={share} className="btn-ghost px-4 py-2 text-sm font-semibold rounded-sm mt-3">
          Share it
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3.5 mt-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Your name</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">College</label>
        <select className="field-input w-full px-2.5 py-2 text-[15px]" value={college} onChange={(e) => setCollege(e.target.value)}>
          {COLLEGES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Why (optional, public)</label>
        <textarea className="field-input w-full px-2.5 py-2 text-[15px] min-h-[70px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="One line" />
      </div>
      <button onClick={sign} disabled={busy} className="btn-red px-5 py-2.5 font-semibold rounded-sm">
        {busy ? "Signing…" : "Sign the petition"}
      </button>
      <button onClick={share} className="btn-ghost px-4 py-2 text-sm font-semibold rounded-sm mt-2.5 ml-2">
        Share it
      </button>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}

export function BuildingReportForm() {
  const [locality, setLocality] = useState<string>(LOCALITIES[0]);
  const [issue, setIssue] = useState("Structural cracks");
  const [desc, setDesc] = useState("");
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function submit() {
    setErr("");
    if (!desc.trim()) return setErr("Describe what you've seen.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setErr("Sign in on the account page first.");
      return;
    }
    const { error } = await supabase.from("building_reports").insert({
      reporter_id: user.id,
      locality,
      issue,
      description: desc.trim(),
      address: addr.trim() || null,
    });
    setBusy(false);
    if (error) setErr("Couldn't file the report.");
    else {
      setDone(true);
      setDesc("");
      setAddr("");
      router.refresh();
    }
  }

  return (
    <div className="notice-card rounded-sm p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-[13.5px] font-medium mb-1">Locality</label>
          <select className="field-input w-full px-2.5 py-2 text-[15px]" value={locality} onChange={(e) => setLocality(e.target.value)}>
            {LOCALITIES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[13.5px] font-medium mb-1">Main issue</label>
          <select className="field-input w-full px-2.5 py-2 text-[15px]" value={issue} onChange={(e) => setIssue(e.target.value)}>
            <option>Structural cracks</option>
            <option>Seepage / water damage</option>
            <option>Exposed or overloaded wiring</option>
            <option>Blocked or missing fire exit</option>
            <option>Unapproved extra floor</option>
            <option>Sagging or damaged staircase</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">What you&apos;ve seen</label>
        <textarea
          className="field-input w-full px-2.5 py-2 text-[15px] min-h-[92px]"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe the condition. Do not name the owner or accuse anyone of a crime — describe the building."
        />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Address (admin only, never published)</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Building and street" />
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
        {busy ? "Submitting…" : "Submit report"}
      </button>
      {done && <p className="text-[14px] mt-2">Report filed. Only the locality count is public.</p>}
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}
