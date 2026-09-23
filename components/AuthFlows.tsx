"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALITIES, isDuEmail } from "@/lib/types";

export default function AuthFlows() {
  const [tab, setTab] = useState<"student" | "owner">("student");

  return (
    <div>
      <h2 className="text-[26px] font-bold tracking-tight mb-2">Two kinds of account</h2>
      <p className="text-[17.5px] text-soft max-w-[60ch] mb-7">
        Listings, contact details, and everything else here need a signed-in account — that's
        what keeps this a DU-only board. You only need to pick one below.
      </p>
      <div className="flex border-b-[1.5px] border-rule mb-6">
        <button
          onClick={() => setTab("student")}
          className={`px-4 py-2.5 font-semibold text-[15px] border-b-4 -mb-[1.5px] ${tab === "student" ? "border-indigo" : "border-transparent"}`}
        >
          I&apos;m a DU student
        </button>
        <button
          onClick={() => setTab("owner")}
          className={`px-4 py-2.5 font-semibold text-[15px] border-b-4 -mb-[1.5px] ${tab === "owner" ? "border-indigo" : "border-transparent"}`}
        >
          I own the property
        </button>
      </div>
      {tab === "student" ? <StudentForm /> : <OwnerForm />}
    </div>
  );
}

function StudentForm() {
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const supabase = createClient();

  async function submit() {
    setErr("");
    if (!name.trim() || !email.trim()) {
      setErr("Name and email are both needed.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("That email doesn't look right.");
      return;
    }
    if (!isDuEmail(email.trim())) {
      setErr("Sign-up is only open to DU email addresses (ending in du.ac.in).");
      return;
    }
    setBusy(true);

    // Save what they typed BEFORE sending the email — the magic-link
    // round trip can't reliably carry it via URL query params.
    const { error: pendingErr } = await supabase.from("pending_signups").upsert({
      email: email.trim(),
      name: name.trim(),
      college: college.trim(),
      course: course.trim(),
      admission_year: admissionYear ? Number(admissionYear) : null,
      area: area.trim(),
      phone: phone.trim(),
    });
    if (pendingErr) {
      setBusy(false);
      setErr("Couldn't save your details. Try again.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function withGoogle() {
    setGoogleBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { hd: "du.ac.in", prompt: "select_account" },
      },
    });
    // browser redirects away; no further local state needed
  }

  if (sent) {
    return (
      <div className="notice-card rounded-sm p-5 max-w-[500px]">
        <h3 className="font-semibold text-lg mb-2">Check your inbox</h3>
        <p className="text-soft text-[15px]">
          We&apos;ve sent a sign-in link to <strong className="text-ink">{email}</strong>. Open it
          on this device to finish setting up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[500px]">
      <button
        onClick={withGoogle}
        disabled={googleBusy}
        className="btn-ghost w-full px-5 py-2.5 font-semibold rounded-sm mb-3 flex items-center justify-center gap-2"
      >
        {googleBusy ? "Redirecting…" : "Continue with Google (DU account)"}
      </button>
      <p className="text-[13px] text-soft mb-5">
        Only Google accounts on a du.ac.in domain will work — anything else will be signed out
        automatically.
      </p>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-rule-thin" />
        <span className="text-[13px] text-soft">or use your DU email</span>
        <div className="h-px flex-1 bg-rule-thin" />
      </div>

      <div className="notice-card rounded-sm p-5">
        <h3 className="font-semibold text-lg mb-4">Student account</h3>
        <Field label="Your name">
          <input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="College or department">
          <input className="field-input w-full px-2.5 py-2 text-[15px]" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Hindu College" />
        </Field>
        <Field label="Course">
          <input className="field-input w-full px-2.5 py-2 text-[15px]" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. BA Hons Economics" />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Admission year">
            <input type="number" inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={admissionYear} onChange={(e) => setAdmissionYear(e.target.value)} placeholder="2023" />
          </Field>
          <Field label="Area you live in">
            <input className="field-input w-full px-2.5 py-2 text-[15px]" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Kamla Nagar" />
          </Field>
        </div>
        <Field label="Email" hint="Must end in du.ac.in — this is what keeps the board DU-only.">
          <input type="email" className="field-input w-full px-2.5 py-2 text-[15px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ramjas.du.ac.in" />
        </Field>
        <Field label="Phone" hint="Kept private — never shown on the website or shared publicly. Only used to reach you about your own listings.">
          <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
        </Field>
        <button onClick={submit} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
          {busy ? "Sending link…" : "Send sign-in link"}
        </button>
        {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
      </div>
    </div>
  );
}

function OwnerForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>(LOCALITIES[0]);
  const [agree, setAgree] = useState(false);
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function normalizedPhone() {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
  }

  async function sendOtp() {
    setErr("");
    if (!name.trim() || !/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) {
      setErr("Enter your name and a valid 10-digit phone number.");
      return;
    }
    if (!agree) {
      setErr("Please confirm the box about your number being shown.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone() });
    setBusy(false);
    if (error) setErr(error.message + " — check that phone/SMS OTP is enabled in Supabase Auth settings.");
    else setStage("otp");
  }

  async function verify() {
    setErr("");
    if (!/^[0-9]{4,8}$/.test(otp)) {
      setErr("Enter the code you received by SMS.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone(),
      token: otp,
      type: "sms",
    });
    if (error || !data.user) {
      setBusy(false);
      setErr(error?.message ?? "Couldn't verify that code.");
      return;
    }
    await supabase
      .from("profiles")
      .update({ role: "owner", name: name.trim(), phone: normalizedPhone(), area, verified: false })
      .eq("id", data.user.id);
    setBusy(false);
    router.push("/post");
    router.refresh();
  }

  return (
    <div className="max-w-[500px]">
      <div className="notice-card rounded-sm p-5">
        <h3 className="font-semibold text-lg mb-4">Owner account</h3>
        {stage === "form" ? (
          <>
            <Field label="Your name">
              <input className="field-input w-full px-2.5 py-2 text-[15px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Phone number" hint="Students will call this number. It appears on every listing you post.">
              <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
            </Field>
            <Field label="Where are your properties">
              <select className="field-input w-full px-2.5 py-2 text-[15px]" value={area} onChange={(e) => setArea(e.target.value)}>
                {LOCALITIES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <label className="flex gap-2.5 items-start text-[14.5px] mb-4">
              <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                I agree my number will be shown publicly on my listings, and that this site takes
                no money and acts for neither side.
              </span>
            </label>
            <button onClick={sendOtp} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
              {busy ? "Sending code…" : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <p className="text-[14.5px] text-soft mb-3">Enter the code sent to {normalizedPhone()}</p>
            <Field label="OTP">
              <input inputMode="numeric" className="field-input w-full px-2.5 py-2 text-[15px]" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
            </Field>
            <button onClick={verify} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm">
              {busy ? "Verifying…" : "Verify and create account"}
            </button>
          </>
        )}
        {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[13.5px] font-medium mb-1">{label}</label>
      {children}
      {hint && <p className="text-[13px] text-soft mt-1">{hint}</p>}
    </div>
  );
}
