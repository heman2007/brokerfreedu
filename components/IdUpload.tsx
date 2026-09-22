"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function IdUpload({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function upload(file: File) {
    setErr("");
    setBusy(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("id-uploads").upload(path, file);
    if (upErr) {
      setBusy(false);
      setErr("Couldn't upload that file. Try a smaller image.");
      return;
    }
    const { error: dbErr } = await supabase.from("profiles").update({ id_upload_path: path }).eq("id", userId);
    setBusy(false);
    if (dbErr) setErr("Uploaded, but couldn't save the record. Try again.");
    else {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return <p className="text-[14.5px] font-medium">Uploaded. An admin will review it — you'll be able to post once approved.</p>;
  }

  return (
    <div className="notice-card rounded-sm p-4 mt-4">
      <h3 className="font-semibold mb-2">Verify with your college ID</h3>
      <p className="text-[14.5px] text-soft mb-3">
        Your email isn&apos;t a recognised DU address, so upload a photo of your college ID or
        admission slip for an admin to check by hand.
      </p>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}
