import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import Filters from "@/components/Filters";
import type { Listing } from "@/lib/types";

export const revalidate = 0;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { loc?: string; type?: string; max?: string; by?: string; sort?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("listings")
    .select("*, photos:listing_photos(id, path, position)")
    .neq("status", "removed");

  if (searchParams.loc) query = query.eq("locality", searchParams.loc);
  if (searchParams.type) query = query.eq("type", searchParams.type);
  if (searchParams.max) query = query.lte("rent", Number(searchParams.max));
  if (searchParams.by) query = query.lte("leaving_date", searchParams.by);

  const sort = searchParams.sort ?? "soon";
  if (sort === "cheap") query = query.order("rent", { ascending: true });
  else if (sort === "new") query = query.order("created_at", { ascending: false });
  else query = query.order("leaving_date", { ascending: true });

  const { data: raw } = await query.limit(200);
  const listings = (raw ?? [])
    .map((l: any) => ({ ...l, photos: (l.photos ?? []).sort((a: any, b: any) => a.position - b.position) }))
    .filter((l: Listing) => l.status !== "filled") as Listing[];

  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5">
        <h2 className="font-serif text-[26px] font-bold tracking-tight mb-2">
          {listings.length} place{listings.length === 1 ? "" : "s"} open
        </h2>
        <p className="text-[17.5px] text-soft max-w-[60ch] mb-6">
          Sorted by who&apos;s leaving soonest. Contact details are on every listing.
        </p>
        <Filters />
        {listings.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-rule rounded-sm p-9 text-center">
            <h3 className="font-semibold text-lg mb-2">No match yet</h3>
            <p className="text-soft max-w-[42ch] mx-auto mb-4">
              Widen the rent range or the date, or set an eye on this area by posting what
              you&apos;re leaving behind.
            </p>
            <Link href="/post" className="btn-ghost inline-block px-5 py-3 font-semibold rounded-sm">
              Post a flat
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
