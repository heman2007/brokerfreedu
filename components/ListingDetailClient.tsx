"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ContactReveal({
  ownerName,
  ownerPhone,
  posterPhone,
  posterRole,
}: {
  ownerName: string | null;
  ownerPhone: string | null;
  posterPhone: string | null;
  posterRole: string;
}) {
  const [shown, setShown] = useState(false);
  if (!shown) {
    return (
      <button onClick={() => setShown(true)} className="btn-primary w-full px-5 py-3 font-semibold rounded-sm">
        Show contact details
      </button>
    );
  }
  return (
    <div>
      {ownerPhone ? (
        <>
          <p className="text-[14px] text-soft mb-1">Owner{ownerName ? ` · ${ownerName}` : ""}</p>
          <p className="text-[20px] font-bold tracking-tight mb-3">
            <a href={`tel:${ownerPhone}`}>{ownerPhone}</a>
          </p>
        </>
      ) : (
        <p className="text-[14.5px] text-soft mb-3">No owner number on file for this listing.</p>
      )}
      {posterPhone && (
        <>
          {/* Students are never named here, even next to their own number —
              that's the whole point of the anonymous posting. */}
          <p className="text-[14px] text-soft mb-1">
            {posterRole === "owner" ? "Also" : "Backup contact (outgoing tenant)"}
          </p>
          <p className="text-[20px] font-bold tracking-tight">
            <a href={`tel:${posterPhone}`}>{posterPhone}</a>
          </p>
        </>
      )}
      <p className="text-[13px] text-soft mt-3">
        No brokerage is payable to anyone for this listing. If a fee is asked, report it below.
      </p>
    </div>
  );
}

export function ReportButton({ listingId }: { listingId: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  async function submit() {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Sign in first so we know who's reporting — it takes a minute on the account page.");
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("reports")
      .insert({ listing_id: listingId, reporter_id: user.id, reason: "broker_or_fake" });
    setBusy(false);
    if (!error) setDone(true);
  }

  if (done) return <p className="text-[14px] text-soft mt-2">Reported. An admin will review it.</p>;
  return (
    <button onClick={submit} disabled={busy} className="underline text-[14px] text-indigo mt-2">
      Report this listing (broker, fake, or asked me for brokerage)
    </button>
  );
}

export function MarkFilledButton({ listingId, isOwnListing }: { listingId: string; isOwnListing: boolean }) {
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  if (!isOwnListing || done) return null;

  return (
    <button
      onClick={async () => {
        const { error } = await supabase.from("listings").update({ status: "filled" }).eq("id", listingId);
        if (!error) {
          setDone(true);
          router.refresh();
        }
      }}
      className="btn-ghost px-4 py-2 text-sm font-semibold rounded-sm mt-4"
    >
      Mark as filled
    </button>
  );
}
