import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDuEmail } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email ?? "";

      // Google's "hd" query param only hints the account picker — it does
      // NOT stop someone from typing in a non-DU Google account. This is
      // the real enforcement point, for both Google and email sign-in.
      if (!isDuEmail(email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/account?error=not_du_email`);
      }

      const provider = data.user.app_metadata?.provider;

      // Pick up what they typed on the sign-up form before their email
      // was verified, keyed by email rather than carried through the
      // redirect URL (which Supabase's own link rewriting doesn't
      // reliably preserve).
      const { data: pending } = await supabase
        .from("pending_signups")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      const googleName =
        provider === "google" ? (data.user.user_metadata?.full_name as string | undefined) : undefined;

      await supabase
        .from("profiles")
        .update({
          role: "student",
          name: pending?.name || googleName || undefined,
          college: pending?.college || undefined,
          course: pending?.course || undefined,
          admission_year: pending?.admission_year ?? undefined,
          area: pending?.area || undefined,
          phone: pending?.phone || undefined,
          email,
          verified: true,
        })
        .eq("id", data.user.id);

      if (pending) {
        await supabase.from("pending_signups").delete().eq("email", email);
      }
    }
  }

  return NextResponse.redirect(`${origin}/account`);
}
