"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CompleteProfile({
  userId,
  email,
  defaultName,
}: {
  userId: string;
  email: string | null;
  defaultName?: string | null;
}) {
  const [name, setName] = useState(defaultName || "");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function save() {
    setErr("");
    if (!name.trim() || !college.trim() || !phone.trim()) {
      setErr("Name, college, and phone are needed to continue.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "student",
        name: name.trim(),
        college: college.trim(),
        course: course.trim(),
        admission_year: admissionYear ? Number(admissionYear) : null,
        area: area.trim(),
        phone: phone.trim(),
        verified: true,
      })
      .eq("id", userId);
    setBusy(false);
    if (error) setErr("Couldn't save. Try again.");
    else router.refresh();
  }

  return (
    <div className="notice-card rounded-sm p-5 max-w-[500px]">
      <h3 className="font-semibold text-lg mb-1">Finish setting up your account</h3>
      <p className="text-[14.5px] text-soft mb-4">
        You&apos;re signed in{email ? ` as ${email}` : ""} — just a few more details to continue.
      </p>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Your name</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">College or department</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Hindu College" />
      </div>
      <div className="mb-3.5">
        <label className="block text-[13.5px] font-medium mb-1">Course</label>
        <input className="field-input w-full px-2.5 py-2 text-[15px]" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. BA Hons Economics" />
      </div>
      <div className="grid grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-[13.5px] font-medium mb-1">Admission year</label>
          <input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={admissionYear} onChange={(e) => setAdmissionYear(e.target.value)} placeholder="2023" />
        </div>
        <div>
          <label className="block text-[13.5px] font-medium mb-1">Area you live in</label>
          <input className="field-input w-full px-2.5 py-2 text-[15px]" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Kamla Nagar" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-[13.5px] font-medium mb-1">Phone</label>
        <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
        <p className="text-[13px] text-soft mt-1">Kept private — never shown on the website or shared publicly.</p>
      </div>
      <button onClick={save} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
        {busy ? "Saving…" : "Save and continue"}
      </button>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}
