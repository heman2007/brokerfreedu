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

  const navLink = "py-2 border-b border-transparent hover:border-ink transition-colors";

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-rule">
      <div className="max-w-[1240px] mx-auto px-6 h-[76px] flex items-center gap-8">
        <Link href="/" className="font-serif text-[21px] tracking-tight whitespace-nowrap">
          broker<span className="chip-marker">free</span>DU
        </Link>

        <nav className="ml-auto hidden md:flex items-center gap-8 text-[13px] font-medium eyebrow">
          <Link href="/browse" className={navLink} style={{ letterSpacing: "0.08em" }}>Find a place</Link>
          <Link href="/post" className={navLink} style={{ letterSpacing: "0.08em" }}>Post a flat</Link>

          <Dropdown trigger="Safety">
            <Link href="/petition" className="px-4 py-2.5 hover:opacity-70 transition-opacity text-[13px] normal-case font-normal" style={{ letterSpacing: 0, color: "var(--ink)" }}>Petition</Link>
            <Link href="/danger-zone" className="px-4 py-2.5 hover:opacity-70 transition-opacity text-[13px] normal-case font-normal" style={{ letterSpacing: 0, color: "var(--ink)" }}>Danger Zone</Link>
            <Link href="/yellow-zone" className="px-4 py-2.5 hover:opacity-70 transition-opacity text-[13px] normal-case font-normal" style={{ letterSpacing: 0, color: "var(--ink)" }}>Yellow Zone</Link>
          </Dropdown>

          {user ? (
            <Dropdown trigger={accountLabel}>
              <Link href="/account" className="px-4 py-2.5 hover:opacity-70 transition-opacity text-[13px] normal-case font-normal" style={{ letterSpacing: 0, color: "var(--ink)" }}>{accountLabel}</Link>
              <div className="px-2 py-1.5">
                <SignOutButton />
              </div>
            </Dropdown>
          ) : (
            <Link href="/account" className="btn-primary px-5 py-2 text-[12.5px] font-semibold" style={{ letterSpacing: "0.06em" }}>Sign in</Link>
          )}
        </nav>

        {/* Mobile nav */}
        <details className="ml-auto md:hidden">
          <summary className="list-none cursor-pointer border border-rule px-3 py-1.5 text-sm">
            Menu
          </summary>
          <div className="dropdown-panel absolute left-0 right-0 top-[76px] bg-paper border-b border-rule flex flex-col px-6 py-4 gap-1">
            <Link href="/browse" className="py-2.5">Find a place</Link>
            <Link href="/post" className="py-2.5">Post a flat</Link>
            <p className="eyebrow pt-3 pb-1">Safety</p>
            <Link href="/petition" className="py-2 pl-2">Petition</Link>
            <Link href="/danger-zone" className="py-2 pl-2">Danger Zone</Link>
            <Link href="/yellow-zone" className="py-2 pl-2">Yellow Zone</Link>
            <div className="border-t border-rule-thin mt-2 pt-3">
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
