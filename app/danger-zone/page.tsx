import { createClient } from "@/lib/supabase/server";
import DangerZoneForm from "@/components/DangerZoneForm";

export const revalidate = 0;

function money(n: number) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DangerZonePage() {
  const supabase = createClient();

  const { data: reports } = await supabase
    .from("danger_zone_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (reports ?? []).map((r) => r.id);
  const { data: mediaRows } =
    ids.length > 0
      ? await supabase.from("danger_zone_media").select("*").in("report_id", ids)
      : { data: [] as any[] };

  const mediaByReport = new Map<string, any[]>();
  (mediaRows ?? []).forEach((m) => {
    if (!mediaByReport.has(m.report_id)) mediaByReport.set(m.report_id, []);
    mediaByReport.get(m.report_id)!.push(m);
  });

  return (
    <>
      <section className="py-12" style={{ borderTop: "5px solid var(--signal)" }}>
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="font-serif text-[26px] font-bold tracking-tight mb-2" style={{ color: "var(--signal)" }}>
            Danger Zone
          </h2>
          <p className="text-[17.5px] text-soft max-w-[70ch] mb-8">
            Flag a specific flat or PG that isn&apos;t safe to live in. The address and owner
            number go straight to an admin, who can act on them or pass them to the authorities
            named in the petition — they&apos;re never shown here. What other students see is the
            locality, the description, and any photos or video.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-9 items-start">
            <div className="space-y-4">
              {reports && reports.length > 0 ? (
                reports.map((r) => (
                  <div key={r.id} className="notice-card rounded-sm p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <span className="font-semibold">{r.locality}</span>
                      <span className="text-[13px] text-soft">{fmtDate(r.created_at)}</span>
                    </div>
                    <p className="text-[15px] mb-3">{r.description}</p>
                    {mediaByReport.get(r.id) && mediaByReport.get(r.id)!.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mediaByReport.get(r.id)!.map((m) =>
                          m.kind === "video" ? (
                            <video key={m.id} src={m.path} controls className="w-[140px] h-[100px] object-cover border-[1.5px] border-rule" />
                          ) : (
                            <img key={m.id} src={m.path} alt="" className="w-[110px] h-[85px] object-cover border-[1.5px] border-rule" />
                          )
                        )}
                      </div>
                    )}
                    <div className="text-[13.5px] text-soft flex gap-4 flex-wrap">
                      {r.rent && <span>Rent: {money(r.rent)}</span>}
                      {r.currently_living !== null && (
                        <span>{r.currently_living ? "Reporter lives there" : "Reporter doesn't live there"}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="border-2 border-dashed border-rule rounded-sm p-9 text-center">
                  <h3 className="font-semibold text-lg mb-2">Nothing flagged yet</h3>
                  <p className="text-soft">Be the first to warn other students about an unsafe property.</p>
                </div>
              )}
            </div>
            <aside>
              <DangerZoneForm />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
