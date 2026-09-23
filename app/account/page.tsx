import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthFlows from "@/components/AuthFlows";
import CompleteProfile from "@/components/CompleteProfile";
import ProfileEditForm from "@/components/ProfileEditForm";
import ListingCard from "@/components/ListingCard";
import SignOutButton from "@/components/SignOutButton";
import type { Listing } from "@/lib/types";

export const revalidate = 0;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          {searchParams.error === "not_du_email" && (
            <div className="notice-card rounded-sm p-4 mb-6" style={{ borderColor: "var(--signal)" }}>
              <p className="text-[15px]">
                That Google account isn&apos;t on a DU domain, so it was signed out. Use a du.ac.in
                Google account, or sign in with your DU email instead.
              </p>
            </div>
          )}
          <AuthFlows />
        </div>
      </section>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const incomplete = !profile || !profile.name || !profile.college || !profile.phone;
  if (incomplete) {
    return (
      <section className="py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <CompleteProfile
            userId={user.id}
            email={user.email ?? null}
            defaultName={(user.user_metadata?.full_name as string | undefined) ?? undefined}
          />
        </div>
      </section>
    );
  }

  const { data: mineRaw } = await supabase
    .from("listings")
    .select("*, photos:listing_photos(id, path, position, kind)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const mine = (mineRaw ?? []).map((l: any) => ({
    ...l,
    photos: (l.photos ?? []).sort((a: any, b: any) => a.position - b.position),
  })) as Listing[];

  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-[26px] font-bold tracking-tight mb-1">{profile.name}</h2>
            <p className="text-[16px] text-soft">
              {profile.role === "owner" ? "Owner account" : "Student account"}
              {profile.college ? ` · ${profile.college}` : ""}
              {profile.course ? ` · ${profile.course}` : ""}
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="mt-6">
          <ProfileEditForm profile={profile} />
        </div>

        <div className="flex gap-3 mt-6">
          <Link href="/post" className="btn-primary inline-block px-5 py-3 font-semibold rounded-sm">
            Post a listing
          </Link>
        </div>

        <h2 className="font-serif text-[26px] font-bold tracking-tight mt-11 mb-4">My listings</h2>
        {mine.length > 0 ? (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
              {mine.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            <p className="text-[14px] text-soft mt-4">Open a listing to mark it filled once someone moves in.</p>
          </>
        ) : (
          <div className="border-2 border-dashed border-rule rounded-sm p-9 text-center">
            <h3 className="font-semibold text-lg mb-2">Nothing posted yet</h3>
            <p className="text-soft mb-4">When you know your leaving date, that&apos;s the moment to post.</p>
            <Link href="/post" className="btn-primary inline-block px-5 py-3 font-semibold rounded-sm">
              Post a flat
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
