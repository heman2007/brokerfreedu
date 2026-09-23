import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return supabase;
}

export default async function AdminPage() {
  const supabase = await requireAdmin();
  if (!supabase) {
    return (
      <section className="py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="font-serif text-[26px] font-bold tracking-tight mb-2">Admins only</h2>
          <p className="text-soft">
            This page is for accounts with the <code>admin</code> role. Set one via SQL Editor:{" "}
            <code>update profiles set role = &apos;admin&apos; where email = &apos;you@example.com&apos;;</code>
          </p>
        </div>
      </section>
    );
  }

  const [{ data: pendingProfiles }, { data: reports }, { data: suspicious }, { data: dangerReports }, { data: yellowRequests }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("role", "student").eq("verified", false).not("id_upload_path", "is", null),
      supabase.from("reports").select("*, listings(id, type, locality)").eq("resolved", false).order("created_at", { ascending: false }),
      supabase.from("suspicious_phone_numbers").select("*"),
      supabase.from("danger_zone_reports").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("yellow_zone_requests").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

  async function approveVerification(formData: FormData) {
    "use server";
    const supabase = createClient();
    const id = formData.get("id") as string;
    await supabase.from("profiles").update({ verified: true }).eq("id", id);
    revalidatePath("/admin");
  }

  async function resolveReport(formData: FormData) {
    "use server";
    const supabase = createClient();
    const id = formData.get("id") as string;
    await supabase.from("reports").update({ resolved: true }).eq("id", id);
    revalidatePath("/admin");
  }

  async function removeListing(formData: FormData) {
    "use server";
    const supabase = createClient();
    const id = formData.get("id") as string;
    await supabase.from("listings").update({ status: "removed" }).eq("id", id);
    revalidatePath("/admin");
  }

  async function markDangerReviewed(formData: FormData) {
    "use server";
    const supabase = createClient();
    const id = formData.get("id") as string;
    await supabase.from("danger_zone_reports").update({ status: "reviewed" }).eq("id", id);
    revalidatePath("/admin");
  }

  async function setYellowStatus(formData: FormData) {
    "use server";
    const supabase = createClient();
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    await supabase
      .from("yellow_zone_requests")
      .update({ status, audited_at: status === "audited" ? new Date().toISOString() : null })
      .eq("id", id);
    revalidatePath("/admin");
  }

  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5 space-y-12">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight mb-4">Pending ID verifications</h2>
          {pendingProfiles && pendingProfiles.length > 0 ? (
            <div className="space-y-3">
              {pendingProfiles.map((p) => (
                <div key={p.id} className="notice-card rounded-sm p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-[14px] text-soft">{p.email} · {p.college}</p>
                    <p className="text-[13px] text-soft">Upload: {p.id_upload_path}</p>
                  </div>
                  <form action={approveVerification}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn-primary px-4 py-2 text-sm font-semibold rounded-sm">Approve</button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-soft text-[15px]">Nothing waiting.</p>
          )}
        </div>

        <div>
          <h2 className="text-[24px] font-bold tracking-tight mb-4">Open listing reports</h2>
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="notice-card rounded-sm p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{r.listings?.type} · {r.listings?.locality}</p>
                    <p className="text-[13px] text-soft">Reason: {r.reason} · Listing {r.listing_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={resolveReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn-ghost px-4 py-2 text-sm font-semibold rounded-sm">Mark resolved</button>
                    </form>
                    <form action={removeListing}>
                      <input type="hidden" name="id" value={r.listing_id} />
                      <button className="btn-red px-4 py-2 text-sm font-semibold rounded-sm">Remove listing</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-soft text-[15px]">No open reports.</p>
          )}
        </div>

        <div>
          <h2 className="text-[24px] font-bold tracking-tight mb-4">Numbers on 4+ listings</h2>
          {suspicious && suspicious.length > 0 ? (
            <div className="space-y-2">
              {suspicious.map((s: any) => (
                <div key={s.phone} className="flex justify-between border-b border-rule-thin py-2 text-[15px]">
                  <span>{s.phone}</span>
                  <strong>{s.listing_count} listings</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-soft text-[15px]">Nothing flagged.</p>
          )}
        </div>

        <div>
          <h2 className="text-[24px] font-bold tracking-tight mb-4">Danger Zone reports (full detail)</h2>
          {dangerReports && dangerReports.length > 0 ? (
            <div className="space-y-3">
              {dangerReports.map((d: any) => (
                <div key={d.id} className="notice-card rounded-sm p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold">{d.locality} · {d.status}</p>
                    {d.status === "open" && (
                      <form action={markDangerReviewed}>
                        <input type="hidden" name="id" value={d.id} />
                        <button className="btn-ghost px-3 py-1.5 text-sm font-semibold rounded-sm">Mark reviewed</button>
                      </form>
                    )}
                  </div>
                  <p className="text-[14.5px] mt-1">{d.description}</p>
                  <p className="text-[13px] text-soft mt-1">
                    Address: {d.address} {d.lat && d.lng ? `(${d.lat}, ${d.lng})` : ""}
                  </p>
                  {d.owner_phone && <p className="text-[13px] text-soft">Owner phone: {d.owner_phone}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-soft text-[15px]">No reports filed.</p>
          )}
        </div>

        <div>
          <h2 className="text-[24px] font-bold tracking-tight mb-4">Yellow Zone audit requests</h2>
          {yellowRequests && yellowRequests.length > 0 ? (
            <div className="space-y-3">
              {yellowRequests.map((y: any) => (
                <div key={y.id} className="notice-card rounded-sm p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold">{y.place_name}</p>
                    <span className="text-[13px] font-semibold px-2 py-0.5 border-[1.5px] border-rule">{y.status}</span>
                  </div>
                  <p className="text-[14.5px] mt-1">{y.reason}</p>
                  <p className="text-[13px] text-soft mt-1">Address: {y.address}</p>
                  {y.owner_details && <p className="text-[13px] text-soft">Owner: {y.owner_details}</p>}
                  <div className="flex gap-2 mt-2">
                    {y.status !== "in_progress" && (
                      <form action={setYellowStatus}>
                        <input type="hidden" name="id" value={y.id} />
                        <input type="hidden" name="status" value="in_progress" />
                        <button className="btn-ghost px-3 py-1.5 text-sm font-semibold rounded-sm">Mark in progress</button>
                      </form>
                    )}
                    {y.status !== "audited" && (
                      <form action={setYellowStatus}>
                        <input type="hidden" name="id" value={y.id} />
                        <input type="hidden" name="status" value="audited" />
                        <button className="btn-primary px-3 py-1.5 text-sm font-semibold rounded-sm">Mark audited</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-soft text-[15px]">No requests filed.</p>
          )}
        </div>
      </div>
    </section>
  );
}
