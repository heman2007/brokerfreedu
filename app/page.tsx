import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import Hero3DLoader from "@/components/hero3d/Hero3DLoader";
import { buildNav } from "@/components/hero3d/nav";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let accountLabel = "Sign in";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    accountLabel = profile?.role === "owner" ? "My properties" : "My account";
  }
  const nav = buildNav(accountLabel);

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
      <Hero3DLoader nav={nav} />


      <section className="border-b border-rule py-24">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-serif text-[28px] font-medium tracking-tight mb-8">Recently posted</h2>
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
