import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let accountLabel = "Sign in";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    accountLabel = profile?.role === "owner" ? "My properties" : "My account";
  }

  return (
    <header className="sticky top-0 z-40 bg-paper border-b-[1.5px] border-rule">
      <div className="max-w-[1080px] mx-auto px-5 h-[62px] flex items-center gap-4">
        <Link href="/" className="font-bold text-[19px] tracking-tight whitespace-nowrap">
          broker<span className="chip-marker px-[3px]">free</span>DU
        </Link>
        <nav className="ml-auto hidden md:flex items-center gap-1 text-[14.5px] font-medium">
          <Link href="/browse" className="px-3 py-2 rounded-sm hover:border hover:border-rule border border-transparent">
            Find a place
          </Link>
          <Link href="/post" className="px-3 py-2 rounded-sm hover:border hover:border-rule border border-transparent">
            Post a flat
          </Link>
          <Link href="/petition" className="px-3 py-2 rounded-sm hover:border hover:border-rule border border-transparent">
            Petition
          </Link>
          <Link href="/danger-zone" className="px-3 py-2 rounded-sm hover:border hover:border-rule border border-transparent">
            Danger Zone
          </Link>
          <Link href="/yellow-zone" className="px-3 py-2 rounded-sm hover:border hover:border-rule border border-transparent">
            Yellow Zone
          </Link>
          <Link href="/account" className="px-3 py-2 rounded-sm border border-rule">
            {accountLabel}
          </Link>
          {user && <SignOutButton />}
        </nav>

        {/* Mobile nav */}
        <details className="ml-auto md:hidden">
          <summary className="list-none cursor-pointer border-[1.5px] border-rule rounded-sm px-3 py-1.5 text-sm">
            Menu
          </summary>
          <div className="absolute left-0 right-0 top-[62px] bg-paper border-b-[1.5px] border-rule flex flex-col px-5 py-3 gap-1">
            <Link href="/browse" className="py-2">Find a place</Link>
            <Link href="/post" className="py-2">Post a flat</Link>
            <Link href="/petition" className="py-2">Petition</Link>
            <Link href="/danger-zone" className="py-2">Danger Zone</Link>
            <Link href="/yellow-zone" className="py-2">Yellow Zone</Link>
            <Link href="/account" className="py-2">{accountLabel}</Link>
            {user && (
              <div className="py-2">
                <SignOutButton />
              </div>
            )}
          </div>
        </details>

        {/* Satyagraha badge — confirm wording and image with Deepanshu before this ships. */}
        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l-[1.5px] border-rule-thin whitespace-nowrap">
          <span className="text-[12px] font-bold tracking-wide" style={{ color: "var(--signal)" }}>
            SATYAGRAHA
          </span>
          <span className="text-[11px] text-soft">
            — Deepanshu Shokeen, Vice President, DUSU
          </span>
        </div>
      </div>
    </header>
  );
}
