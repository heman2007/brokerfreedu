import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

export const revalidate = 0;

function money(n: number) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function HomePage() {
  const supabase = createClient();

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("*, photos:listing_photos(id, path, position)")
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(60);

  const listings = (listingsRaw ?? []).map((l: any) => ({
    ...l,
    photos: (l.photos ?? []).sort((a: any, b: any) => a.position - b.position),
  })) as Listing[];

  const active = listings.filter((l) => l.status !== "filled");
  const soon = active
    .filter((l) => {
      const d = Math.ceil((new Date(l.leaving_date).getTime() - Date.now()) / 86400000);
      return d >= -3 && d <= 30;
    })
    .sort((a, b) => new Date(a.leaving_date).getTime() - new Date(b.leaving_date).getTime());
  const recent = active.slice(0, 6);

  return (
    <>
      <section className="border-b-[1.5px] border-rule py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h1 className="text-[clamp(34px,6.2vw,62px)] leading-[1.02] tracking-tight font-bold mb-4">
            The person moving out
            <br />
            knows first.
          </h1>
          <p className="text-[17.5px] text-soft max-w-[60ch] mb-2">
            Brokers around DU charge half a month&apos;s rent for one piece of information: which
            flat is about to be empty. Students already have it. Post it here before you leave,
            and the next student walks in without paying anyone.
          </p>
          <div className="flex items-baseline gap-4 flex-wrap my-6">
            <div className="text-[clamp(64px,13vw,132px)] leading-[0.82] font-bold tracking-tighter chip-marker px-1">
              {soon.length}
            </div>
            <span className="text-[17px] max-w-[19ch] text-soft">
              {soon.length === 1 ? "flat or room opens" : "flats and rooms open"} up near campus
              in the next 30 days
            </span>
          </div>
          {soon.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {soon.slice(0, 8).map((l) => (
                <span key={l.id} className="border-[1.5px] border-rule rounded-sm px-2.5 py-1 text-[13.5px] bg-notice">
                  {l.locality} · {money(l.rent)} · {fmtDate(l.leaving_date)}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/browse" className="btn-primary inline-block px-5 py-3 font-semibold rounded-sm">
              See what&apos;s open
            </Link>
            <Link href="/post" className="btn-ghost inline-block px-5 py-3 font-semibold rounded-sm">
              Post the flat I&apos;m leaving
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b-[1.5px] border-rule py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="text-[26px] font-bold tracking-tight mb-4">Recently posted</h2>
          {recent.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                {recent.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-5">
                <Link href="/browse" className="btn-ghost inline-block px-5 py-3 font-semibold rounded-sm">
                  All listings
                </Link>
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-rule rounded-sm p-9 text-center">
              <h3 className="font-semibold text-lg mb-2">Nothing posted yet</h3>
              <p className="text-soft max-w-[44ch] mx-auto mb-4">
                The first listing on a board like this usually comes from someone packing up. If
                that&apos;s you, take four photos before the room empties out.
              </p>
              <Link href="/post" className="btn-primary inline-block px-5 py-3 font-semibold rounded-sm">
                Post the flat I&apos;m leaving
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-12" style={{ borderTop: "5px solid var(--signal)" }}>
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="text-[26px] font-bold tracking-tight mb-4">
            Buildings don&apos;t get a fitness certificate. Vehicles do.
          </h2>
          <p className="text-[17.5px] text-soft max-w-[60ch] mb-6">
            A petrol car is taken off Delhi&apos;s roads at 15 years for the air it fouls. The
            building your PG is in has no comparable safety re-check, and when one fails, nobody
            is clearly answerable.
          </p>
          <Link href="/petition" className="btn-red inline-block px-5 py-3 font-semibold rounded-sm">
            Read and sign the petition
          </Link>
        </div>
      </section>
    </>
  );
}
