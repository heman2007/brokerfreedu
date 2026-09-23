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

  const { count: signatureCount } = await supabase
    .from("petition_signatures")
    .select("*", { count: "exact", head: true });

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
      <section className="border-b-[1.5px] border-rule min-h-[100dvh] flex items-center">
        <div className="max-w-[1200px] mx-auto px-5 w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-center">
          <div className="animate-fade-in">
            <h1 className="font-serif text-[clamp(34px,7vw,72px)] leading-[1.02] tracking-tight font-semibold mb-4">
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
              <div className="text-[clamp(64px,13vw,132px)] leading-[0.82] font-bold tracking-tighter chip-marker px-1 transition-transform hover:scale-105">
                {soon.length}
              </div>
              <span className="text-[17px] max-w-[19ch] text-soft">
                {soon.length === 1 ? "flat or room opens" : "flats and rooms open"} up near campus
                in the next 30 days
              </span>
            </div>
            {soon.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {soon.slice(0, 8).map((l, i) => (
                  <span
                    key={l.id}
                    className="border-[1.5px] border-rule rounded-sm px-2.5 py-1 text-[13.5px] bg-notice animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                  >
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

          {/* Satyagraha — placeholder wording/photo, confirm with Deepanshu before shipping */}
          <div className="lg:border-l lg:border-rule-thin lg:pl-9 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
            <h2
              className="font-serif text-[42px] font-semibold tracking-tight leading-[0.95] mb-1"
              style={{ color: "var(--signal)" }}
            >
              Satyagraha
            </h2>
            <p className="font-serif italic text-[15px] text-soft mb-4">movement by</p>
            <p className="text-[20px] font-semibold leading-tight mb-1">Deepanshu Shokeen</p>
            <p className="text-[12px] font-semibold text-soft uppercase tracking-[0.08em]">
              DUSU Vice President 2026
            </p>
          </div>
        </div>
      </section>

      <section className="border-b-[1.5px] border-rule py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="font-serif text-[26px] font-bold tracking-tight mb-4">Recently posted</h2>
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

      <section className="border-b-[1.5px] border-rule py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="font-serif text-[26px] font-bold tracking-tight mb-6">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="pt-3.5" style={{ borderTop: "3px solid var(--ink)" }}>
              <span className="text-[13px] font-bold text-indigo block mb-1.5">Step 1</span>
              <h3 className="font-semibold text-lg mb-1">You give notice</h3>
              <p className="text-[15px] text-soft">
                A month before you move out, you post the room with the date you&apos;re leaving,
                the real rent, and the deposit.
              </p>
            </div>
            <div className="pt-3.5" style={{ borderTop: "3px solid var(--ink)" }}>
              <span className="text-[13px] font-bold text-indigo block mb-1.5">Step 2</span>
              <h3 className="font-semibold text-lg mb-1">Someone plans around it</h3>
              <p className="text-[15px] text-soft">
                Students filter by the date they need a place, not by whatever a broker happens
                to be sitting on that week.
              </p>
            </div>
            <div className="pt-3.5" style={{ borderTop: "3px solid var(--ink)" }}>
              <span className="text-[13px] font-bold text-indigo block mb-1.5">Step 3</span>
              <h3 className="font-semibold text-lg mb-1">They talk to the owner</h3>
              <p className="text-[15px] text-soft">
                Contact details are visible to every signed-in student, free. Nobody takes a cut.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-[1.5px] border-rule py-10">
        <div className="max-w-[1080px] mx-auto px-5 flex items-center gap-6 flex-wrap">
          <div className="text-[clamp(48px,9vw,88px)] font-bold tracking-tighter leading-none" style={{ color: "var(--signal)" }}>
            {signatureCount ?? 0}
          </div>
          <div>
            <p className="text-[17px] font-semibold">
              student{(signatureCount ?? 0) === 1 ? "" : "s"} have signed the building safety petition
            </p>
            <Link href="/petition" className="underline text-[15px] text-indigo">
              Read it and add your name
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12" style={{ borderTop: "5px solid var(--signal)" }}>
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="font-serif text-[26px] font-bold tracking-tight mb-4">
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
