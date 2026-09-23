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
      const meta = data.user.user_metadata || {};

      // Password sign-up passes name/college/course/admission_year/area/phone
      // straight into user_metadata at signUp() time — no fragile round trip
      // needed. Google gives us a name but none of the DU-specific fields,
      // so those stay blank and CompleteProfile picks up the slack.
      const googleName = provider === "google" ? (meta.full_name as string | undefined) : undefined;

      await supabase
        .from("profiles")
        .update({
          role: meta.role || "student",
          name: meta.name || googleName || undefined,
          college: meta.college || undefined,
          course: meta.course || undefined,
          admission_year: meta.admission_year ?? undefined,
          area: meta.area || undefined,
          phone: meta.phone || undefined,
          email,
          verified: true,
        })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(`${origin}/account`);
}
