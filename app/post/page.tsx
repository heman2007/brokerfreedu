import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/PostForm";
import CompleteProfile from "@/components/CompleteProfile";

export const revalidate = 0;

export default async function PostPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="text-[26px] font-bold tracking-tight mb-2">Tell us who you are first</h2>
          <p className="text-[17.5px] text-soft max-w-[60ch] mb-6">
            Listings are posted by students moving out or by owners directly. Pick which one you
            are — it takes a minute and it&apos;s the only thing keeping brokers off this board.
          </p>
          <Link href="/account" className="btn-primary inline-block px-5 py-3 font-semibold rounded-sm">
            Set up my account
          </Link>
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

  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5">
        <PostForm profile={profile} userId={user.id} />
      </div>
    </section>
  );
}
