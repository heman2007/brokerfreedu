import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const name = searchParams.get("name") ?? "";
  const college = searchParams.get("college") ?? "";
  const phone = searchParams.get("phone") ?? "";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email ?? "";
      const verified = /\.du\.ac\.in$/i.test(email.split("@")[1] ?? "");
      await supabase
        .from("profiles")
        .update({
          role: "student",
          name: name || undefined,
          college: college || undefined,
          phone: phone || undefined,
          email,
          verified,
        })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(`${origin}/account`);
}
