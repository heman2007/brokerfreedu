import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";

function money(n: number) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function daysTo(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const d = daysTo(listing.leaving_date);
  const filled = listing.status === "filled";
  const when = filled
    ? "Filled"
    : d < 0
    ? "Available now"
    : d === 0
    ? "Available today"
    : `Free in ${d} day${d === 1 ? "" : "s"}`;
  const photo = listing.photos?.[0]?.path;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`notice-card block rounded-sm overflow-hidden ${filled ? "opacity-60" : ""}`}
    >
      <div className="aspect-[4/3] bg-rule-thin border-b-[1.5px] border-rule relative overflow-hidden">
        {photo ? (
          <Image src={photo} alt={`${listing.type} in ${listing.locality}`} fill className="object-cover" />
        ) : null}
        {filled && (
          <span className="absolute top-3 left-3 bg-ink text-paper text-xs font-bold px-2 py-1">
            Filled
          </span>
        )}
      </div>
      <div className="px-4 pt-3 pb-4">
        <div className="text-[26px] font-bold tracking-tight leading-none">
          {money(listing.rent)} <small className="text-[13px] font-medium text-soft">/ month</small>
        </div>
        <div className="text-[14px] text-soft mt-1">
          {listing.type} · {listing.locality}
        </div>
        <div className="text-[14px] text-soft">
          {listing.campus}
          {listing.walk_minutes ? ` · ${listing.walk_minutes} min walk` : ""}
        </div>
        <span className="inline-block chip-marker font-semibold text-[13.5px] px-2 py-0.5 mt-3">
          {when} · {fmtDate(listing.leaving_date)}
        </span>
        <span className={`inline-block text-[11.5px] font-semibold border-[1.5px] border-rule px-1.5 py-0.5 mt-3 ml-1.5 ${listing.poster_role === "owner" ? "bg-indigo border-indigo text-white" : ""}`}>
          {listing.poster_role === "owner" ? "Posted by owner" : "Outgoing tenant"}
        </span>
      </div>
    </Link>
  );
}
