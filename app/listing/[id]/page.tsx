import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactReveal, ReportButton, MarkFilledButton } from "@/components/ListingDetailClient";
import { yearOfStudyLabel, type Listing } from "@/lib/types";

export const revalidate = 0;

function money(n: number) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: raw } = await supabase
    .from("listings")
    .select("*, photos:listing_photos(id, path, position, kind)")
    .eq("id", params.id)
    .single();

  if (!raw) notFound();
  const listing = { ...raw, photos: (raw.photos ?? []).sort((a: any, b: any) => a.position - b.position) } as Listing;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const total = Number(listing.rent) + Number(listing.maintenance);

  const posterLine =
    listing.poster_role === "owner"
      ? "the owner"
      : `${yearOfStudyLabel(listing.poster_admission_year)} ${listing.poster_college || "DU"} student`;

  const mapHref =
    listing.lat && listing.lng ? `https://www.openstreetmap.org/?mlat=${listing.lat}&mlon=${listing.lng}#map=18/${listing.lat}/${listing.lng}` : null;

  return (
    <section className="py-10">
      <div className="max-w-[1080px] mx-auto px-5">
        <Link href="/browse" className="underline text-[14px] text-indigo mb-5 inline-block">
          ← Back to listings
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-[1.25fr_.9fr] gap-9 items-start">
          <div>
            <h1 className="font-serif text-[28px] font-semibold tracking-tight mb-1">
              {listing.type} in {listing.locality}
            </h1>
            <p className="text-soft text-[15px] mb-1">{listing.address}</p>
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className="text-[14px] text-indigo underline">
                View pinned location on the map
              </a>
            )}

            {listing.photos && listing.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {listing.photos.map((p, i) => (
                  <div
                    key={p.id}
                    className={`relative border-[1.5px] border-rule ${i === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/3]"}`}
                  >
                    {(p as any).kind === "video" ? (
                      <video src={p.path} controls className="w-full h-full object-cover" />
                    ) : (
                      <Image src={p.path} alt={`Photo ${i + 1}`} fill className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-rule p-8 text-center text-soft mt-4">No photos on this listing</div>
            )}

            {listing.honest_note && (
              <>
                <h3 className="font-semibold text-lg mt-7 mb-2">What the outgoing tenant wants you to know</h3>
                <blockquote className="font-serif text-[18px] leading-relaxed border-l-4 pl-4 mb-5" style={{ borderColor: "var(--gold)" }}>
                  {listing.honest_note}
                </blockquote>
              </>
            )}

            {listing.reason_leaving && (
              <>
                <h3 className="font-semibold text-lg mb-1">Reason for leaving</h3>
                <p className="mb-4">{listing.reason_leaving}</p>
              </>
            )}
            {listing.preferred_tenants && (
              <>
                <h3 className="font-semibold text-lg mb-1">Preferred tenants</h3>
                <p className="mb-4">{listing.preferred_tenants}</p>
              </>
            )}

            <p className="text-[14px] text-soft">
              Posted {fmtDate(listing.created_at)} by {posterLine}.
            </p>
            <ReportButton listingId={listing.id} />
            <MarkFilledButton listingId={listing.id} isOwnListing={!!user && user.id === listing.owner_id} />
          </div>

          <aside>
            <div className="notice-card rounded-sm p-4 mb-5">
              <div className="text-[34px] font-bold tracking-tight leading-none">
                {money(listing.rent)} <small className="text-[15px] font-medium text-soft">/ month</small>
              </div>
              <span className="inline-block chip-marker font-semibold text-[13.5px] px-2 py-0.5 my-3">
                Available from {fmtDate(listing.leaving_date)}
              </span>
              <table className="w-full text-[15px] mt-3 border-collapse">
                <tbody>
                  <tr className="border-b border-rule-thin">
                    <td className="py-2">Rent</td>
                    <td className="py-2 text-right font-semibold">{money(listing.rent)}</td>
                  </tr>
                  <tr className="border-b border-rule-thin">
                    <td className="py-2">Security deposit</td>
                    <td className="py-2 text-right font-semibold">{money(listing.deposit)}</td>
                  </tr>
                  <tr className="border-b border-rule-thin">
                    <td className="py-2">Maintenance</td>
                    <td className="py-2 text-right font-semibold">{listing.maintenance ? money(listing.maintenance) : "None"}</td>
                  </tr>
                  <tr className="border-b border-rule-thin">
                    <td className="py-2">Brokerage</td>
                    <td className="py-2 text-right font-semibold text-indigo">₹0</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold">Monthly outgo</td>
                    <td className="py-2 text-right font-semibold">{money(total)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[13.5px] text-soft mt-2">
                Plus {money(listing.deposit)} refundable deposit up front. Get the return conditions in writing.
              </p>
            </div>

            <div className="border-[1.5px] rounded-sm p-4 mb-5" style={{ borderColor: "var(--signal)" }}>
              <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--signal)" }}>
                Before you contact anyone
              </h3>
              <ul className="list-disc pl-5 text-[14.5px] space-y-1.5">
                <li>Visit in daylight and take someone with you.</li>
                <li>Never pay a deposit or token before seeing the place.</li>
                <li>Insist on a written rent agreement stating the deposit and how it comes back.</li>
                <li>If anyone asks you for brokerage, report them here.</li>
              </ul>
            </div>

            <div className="notice-card rounded-sm p-4">
              <h3 className="font-semibold text-lg mb-3">Contact</h3>
              <ContactReveal
                ownerName={listing.owner_name}
                ownerPhone={listing.owner_phone}
                posterPhone={listing.poster_phone}
                posterRole={listing.poster_role}
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
