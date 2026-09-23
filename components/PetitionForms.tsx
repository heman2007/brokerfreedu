"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALITIES } from "@/lib/types";

export function SignForm({ alreadySigned, defaultCollege }: { alreadySigned: boolean; defaultCollege?: string | null }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function sign() {
    setErr("");
    if (!name.trim()) return setErr("Type your name to sign — an unsigned count is worth nothing.");
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
      .insert({ id: user.id, name: name.trim(), college: defaultCollege || null, message: message.trim() || null });
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
        <label className="block text-[13.5px] font-medium mb-1">Type your name to sign</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        {defaultCollege && <p className="text-[13px] text-soft mt-1">Signing as a student of {defaultCollege}.</p>}
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

