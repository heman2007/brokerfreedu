import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import Dropdown from "@/components/Dropdown";

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

  const navLink = "px-3 py-2 rounded-sm border border-transparent hover:border-rule transition-colors";

  return (
    <header className="sticky top-0 z-40 bg-paper border-b-[1.5px] border-rule">
      <div className="max-w-[1080px] mx-auto px-5 h-[62px] flex items-center gap-4">
        <Link href="/" className="font-bold text-[19px] tracking-tight whitespace-nowrap">
          broker<span className="chip-marker px-[3px]">free</span>DU
        </Link>

        <nav className="ml-auto hidden md:flex items-center gap-1 text-[14.5px] font-medium">
          <Link href="/browse" className={navLink}>Find a place</Link>
          <Link href="/post" className={navLink}>Post a flat</Link>

          <Dropdown trigger="Safety ▾">
            <Link href="/petition" className="px-4 py-2.5 hover:bg-notice transition-colors">Petition</Link>
            <Link href="/danger-zone" className="px-4 py-2.5 hover:bg-notice transition-colors">Danger Zone</Link>
            <Link href="/yellow-zone" className="px-4 py-2.5 hover:bg-notice transition-colors">Yellow Zone</Link>
          </Dropdown>

          {user ? (
            <Dropdown trigger={`${accountLabel} ▾`}>
              <Link href="/account" className="px-4 py-2.5 hover:bg-notice transition-colors">{accountLabel}</Link>
              <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                <SignOutButton />
              </div>
            </Dropdown>
          ) : (
            <Link href="/account" className={`${navLink} border-rule`}>Sign in</Link>
          )}
        </nav>

        {/* Mobile nav */}
        <details className="ml-auto md:hidden">
          <summary className="list-none cursor-pointer border-[1.5px] border-rule rounded-sm px-3 py-1.5 text-sm">
            Menu
          </summary>
          <div className="dropdown-panel absolute left-0 right-0 top-[62px] bg-paper border-b-[1.5px] border-rule flex flex-col px-5 py-3 gap-1">
            <Link href="/browse" className="py-2">Find a place</Link>
            <Link href="/post" className="py-2">Post a flat</Link>
            <p className="pt-2 pb-1 text-[12px] font-semibold text-soft uppercase tracking-wide">Safety</p>
            <Link href="/petition" className="py-2 pl-2">Petition</Link>
            <Link href="/danger-zone" className="py-2 pl-2">Danger Zone</Link>
            <Link href="/yellow-zone" className="py-2 pl-2">Yellow Zone</Link>
            <div className="border-t border-rule-thin mt-2 pt-2">
              <Link href="/account" className="py-2 block">{accountLabel}</Link>
              {user && (
                <div className="py-1">
                  <SignOutButton />
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
