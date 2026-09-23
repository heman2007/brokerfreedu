import { createClient } from "@/lib/supabase/server";
import { SignForm } from "@/components/PetitionForms";
import { PETITION_TARGET } from "@/lib/types";

export const revalidate = 0;

export default async function PetitionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: signatures } = await supabase
    .from("petition_signatures")
    .select("id, name, college, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  let profileCollege: string | null = null;
  if (user) {
    const { data: p } = await supabase.from("profiles").select("college").eq("id", user.id).single();
    profileCollege = p?.college ?? null;
  }

  const n = signatures?.length ?? 0;
  const pct = Math.min(100, Math.round((n / PETITION_TARGET) * 100));
  const alreadySigned = !!user && (signatures ?? []).some((s) => s.id === user.id);

  return (
    <>
      <section className="py-12" style={{ borderTop: "5px solid var(--signal)" }}>
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="text-[26px] font-bold tracking-tight mb-6">
            Mandatory safety audits for buildings used as student housing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-9 items-start">
            <div>
              <div className="font-serif text-[18.5px] leading-relaxed max-w-[62ch] space-y-4">
                <p>
                  Delhi-NCR takes a diesel vehicle off the road at ten years and a petrol vehicle
                  at fifteen, on the reasoning that an ageing machine in public use becomes a
                  public risk and someone must check it on a schedule.
                </p>
                <p>
                  The buildings that house Delhi University students carry no comparable
                  requirement. A great many of the PGs and rented flats around North and South
                  Campus sit in structures put up decades ago, later extended upward floor by
                  floor to add beds. There is no periodic structural re-certification tied to
                  their use as accommodation, and when something fails, responsibility disperses
                  between the building&apos;s owner, the person operating the PG inside it, and
                  the municipal body — with the student, who signed nothing and was told nothing,
                  at the end of that chain.
                </p>
                <p>
                  We ask the Municipal Corporation of Delhi and the Delhi Development Authority,
                  and the University of Delhi administration for housing it recognises or
                  recommends, to require: a structural safety audit by a licensed structural
                  engineer for any residential building let to five or more student tenants,
                  repeated on a fixed cycle; the audit certificate and its date displayed at the
                  building entrance and filed publicly; a named person accountable for acting on
                  the findings; and a complaints route a student can use without going through
                  their landlord.
                </p>
                <p>
                  We are not asking for anyone&apos;s home to be demolished. We are asking for the
                  same thing the city already asks of a fifteen-year-old car: a scheduled check by
                  someone qualified, and a name on the certificate.
                </p>
              </div>
              <p className="text-[13px] text-soft mt-4">
                This petition states a demand, not an allegation against any named building, owner
                or operator. Keep it that way when you share it.
              </p>
            </div>

            <aside>
              <div className="notice-card rounded-sm p-4">
                <div className="text-[clamp(38px,7vw,64px)] font-bold tracking-tighter leading-none">
                  {n.toLocaleString("en-IN")}
                </div>
                <p className="text-[14px] text-soft mt-1">signature{n === 1 ? "" : "s"} of {PETITION_TARGET.toLocaleString("en-IN")}</p>
                <div className="h-5 border-[1.5px] border-rule bg-notice mt-3 mb-2">
                  <div className="h-full" style={{ width: `${pct}%`, background: "var(--signal)" }} />
                </div>
                {alreadySigned ? (
                  <p className="font-semibold mt-3">You&apos;ve signed this. Thanks.</p>
                ) : (
                  <SignForm alreadySigned={alreadySigned} defaultCollege={profileCollege} />
                )}
              </div>

              <h3 className="font-semibold text-lg mt-7 mb-2">Recent signatures</h3>
              <div className="max-h-[280px] overflow-auto border-[1.5px] border-rule bg-notice px-3.5 py-2.5 text-[14px]">
                {signatures && signatures.length > 0 ? (
                  signatures.map((s) => (
                    <div key={s.id} className="py-1.5 border-b border-rule-thin last:border-none">
                      <strong>{s.name}</strong> · {s.college || "DU"}
                    </div>
                  ))
                ) : (
                  <div className="text-soft">No signatures yet. Yours would be the first.</div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1080px] mx-auto px-5">
          <h2 className="text-[26px] font-bold tracking-tight mb-4">Rent Control</h2>
          <p className="text-[17.5px] text-soft max-w-[70ch] mb-7">
            The other half of this problem: what students actually pay near campus, for what they
            actually get.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="notice-card rounded-sm p-5">
              <div className="text-[38px] font-bold tracking-tight leading-none mb-2">₹15,000<small className="text-[15px] font-medium text-soft">/mo</small></div>
              <h3 className="font-semibold mb-1">A single, windowless room</h3>
              <p className="text-[15px] text-soft">
                Built-in kitchen and bathroom, no window, in areas like Kamla Nagar — routinely
                priced around this mark.
              </p>
            </div>
            <div className="notice-card rounded-sm p-5">
              <div className="text-[38px] font-bold tracking-tight leading-none mb-2">₹12,000–15,000<small className="text-[15px] font-medium text-soft">/mo avg</small></div>
              <h3 className="font-semibold mb-1">A shared PG room, 3–4 beds</h3>
              <p className="text-[15px] text-soft">
                Multiple students sharing one room at this price point, near the same campuses.
              </p>
            </div>
          </div>
          <p className="text-[13px] text-soft mt-5">
            Figures reported by students on this platform, not an official survey — treat them as
            a snapshot of what people are actually paying, not a government rate.
          </p>
        </div>
      </section>
    </>
  );
}
