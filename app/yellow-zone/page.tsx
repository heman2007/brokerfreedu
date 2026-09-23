import { createClient } from "@/lib/supabase/server";
import YellowZoneForm from "@/components/YellowZoneForm";

export const revalidate = 0;

export default async function YellowZonePage() {
  const supabase = createClient();

  const { data: countRow } = await supabase.from("yellow_zone_audited_count").select("count").single();
  const auditedCount = countRow?.count ?? 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let mine: any[] = [];
  if (user) {
    const { data } = await supabase
      .from("yellow_zone_requests")
      .select("*")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false });
    mine = data ?? [];
  }

  const statusLabel: Record<string, string> = {
    requested: "Requested",
    in_progress: "Being looked into",
    audited: "Audited",
  };

  return (
    <section className="py-12" style={{ borderTop: "5px solid #E8B800" }}>
      <div className="max-w-[1080px] mx-auto px-5">
        <h2 className="text-[26px] font-bold tracking-tight mb-2">Yellow Zone</h2>
        <p className="text-[17.5px] text-soft max-w-[70ch] mb-6">
          Ask us to audit your PG or flat for safety, before something goes wrong rather than
          after. Address and owner details stay admin-only, same as everywhere else on this site.
        </p>

        <div className="notice-card rounded-sm p-4 mb-8 inline-block">
          <div className="text-[42px] font-bold tracking-tight leading-none">{auditedCount}</div>
          <p className="text-[14px] text-soft mt-1">properties audited so far</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-9 items-start">
          <div>
            {mine.length > 0 ? (
              <>
                <h3 className="font-semibold text-lg mb-3">Your requests</h3>
                <div className="space-y-3">
                  {mine.map((r) => (
                    <div key={r.id} className="notice-card rounded-sm p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold">{r.place_name}</span>
                        <span className="text-[13px] font-semibold px-2 py-0.5 border-[1.5px] border-rule">
                          {statusLabel[r.status] || r.status}
                        </span>
                      </div>
                      <p className="text-[14.5px] text-soft mt-1">{r.reason}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="border-2 border-dashed border-rule rounded-sm p-9 text-center">
                <h3 className="font-semibold text-lg mb-2">No requests yet</h3>
                <p className="text-soft">Ask for a check on your own place using the form.</p>
              </div>
            )}
          </div>
          <aside>
            <YellowZoneForm />
          </aside>
        </div>
      </div>
    </section>
  );
}
