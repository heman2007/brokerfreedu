"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name || "");
  const [college, setCollege] = useState(profile.college || "");
  const [course, setCourse] = useState(profile.course || "");
  const [admissionYear, setAdmissionYear] = useState(profile.admission_year?.toString() || "");
  const [area, setArea] = useState(profile.area || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function save() {
    setErr("");
    if (!name.trim() || !phone.trim()) {
      setErr("Name and phone can't be left empty.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        college: college.trim(),
        course: course.trim(),
        admission_year: admissionYear ? Number(admissionYear) : null,
        area: area.trim(),
        phone: phone.trim(),
      })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      setErr(`Couldn't save: ${error.message}`);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="notice-card rounded-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h3 className="font-serif font-semibold text-lg">Your details</h3>
          <button onClick={() => setEditing(true)} className="btn-ghost px-3.5 py-1.5 text-sm font-semibold rounded-sm">
            Edit
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-3 text-[15px]">
          <Row label="Name" value={profile.name} />
          <Row label="College / department" value={profile.college} />
          <Row label="Course" value={profile.course} />
          <Row label="Admission year" value={profile.admission_year?.toString()} />
          <Row label="Area you live in" value={profile.area} />
          <Row label="Phone" value={profile.phone} hint="Private — never shown publicly" />
        </dl>
      </div>
    );
  }

  return (
    <div className="notice-card rounded-sm p-5">
      <h3 className="font-serif font-semibold text-lg mb-4">Edit your details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Field label="Name"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="College / department"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={college} onChange={(e) => setCollege(e.target.value)} /></Field>
        <Field label="Course"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={course} onChange={(e) => setCourse(e.target.value)} /></Field>
        <Field label="Admission year"><input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={admissionYear} onChange={(e) => setAdmissionYear(e.target.value)} /></Field>
        <Field label="Area you live in"><input className="field-input w-full px-2.5 py-2 text-[15px]" value={area} onChange={(e) => setArea(e.target.value)} /></Field>
        <Field label="Phone"><input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={save} disabled={busy} className="btn-primary px-4 py-2 text-sm font-semibold rounded-sm">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button onClick={() => setEditing(false)} className="btn-ghost px-4 py-2 text-sm font-semibold rounded-sm">
          Cancel
        </button>
      </div>
      {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value?: string | null; hint?: string }) {
  return (
    <div>
      <dt className="text-[12.5px] font-semibold text-soft uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5">{value || <span className="text-soft italic">Not set</span>}</dd>
      {hint && <p className="text-[12px] text-soft mt-0.5">{hint}</p>}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13.5px] font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
