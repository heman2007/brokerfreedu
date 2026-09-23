"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALITIES, isDuEmail } from "@/lib/types";

export default function AuthFlows() {
  const [tab, setTab] = useState<"student" | "owner">("student");

  return (
    <div>
      <h2 className="font-serif text-[26px] font-bold tracking-tight mb-2">Two kinds of account</h2>
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
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const supabase = createClient();

  async function login() {
    setErr("");
    if (!email.trim() || !password) {
      setErr("Enter your email and password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/account");
    router.refresh();
  }

  async function signup() {
    setErr("");
    if (!name.trim() || !college.trim() || !phone.trim() || !email.trim() || !password) {
      setErr("Name, college, phone, email, and a password are all needed.");
      return;
    }
    if (password.length < 6) {
      setErr("Password needs to be at least 6 characters.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("That email doesn't look right.");
      return;
    }
    if (!isDuEmail(email.trim())) {
      setErr("Only DU email addresses (ending in du.ac.in) can sign up here.");
      return;
    }
    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: {
          name: name.trim(),
          college: college.trim(),
          course: course.trim(),
          admission_year: admissionYear ? Number(admissionYear) : null,
          area: area.trim(),
          phone: phone.trim(),
          role: "student",
        },
      },
    });

    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }

    if (data.session && data.user) {
      // Email confirmation is OFF in this Supabase project — already logged in,
      // so write the profile now rather than waiting on a link that won't come.
      await supabase
        .from("profiles")
        .update({
          role: "student",
          name: name.trim(),
          college: college.trim(),
          course: course.trim(),
          admission_year: admissionYear ? Number(admissionYear) : null,
          area: area.trim(),
          phone: phone.trim(),
          email: email.trim(),
          verified: true,
        })
        .eq("id", data.user.id);
      setBusy(false);
      router.push("/account");
      router.refresh();
      return;
    }

    // Email confirmation is ON — one link, once, then password login from here on.
    setBusy(false);
    setAwaitingConfirm(true);
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
  }

  if (awaitingConfirm) {
    return (
      <div className="notice-card rounded-sm p-5 max-w-[500px] animate-fade-in">
        <h3 className="font-semibold text-lg mb-2">Confirm your email</h3>
        <p className="text-soft text-[15px] mb-4">
          We&apos;ve sent a one-time confirmation link to <strong className="text-ink">{email}</strong>.
          Click it once, then come back and log in with the password you just set — no more
          links after this. Check spam if it doesn't show up in a minute or two.
        </p>
        <button
          onClick={async () => {
            setBusy(true);
            const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
            setBusy(false);
            setErr(error ? error.message : "Sent again — check your inbox and spam folder.");
          }}
          disabled={busy}
          className="btn-ghost px-4 py-2 text-sm font-semibold rounded-sm"
        >
          {busy ? "Sending…" : "Resend confirmation email"}
        </button>
        {err && <p className="text-[14px] mt-2" style={{ color: "var(--signal)" }}>{err}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-[500px]">
      <button
        onClick={withGoogle}
        disabled={googleBusy}
        className="btn-ghost w-full px-5 py-2.5 font-semibold rounded-sm mb-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
      >
        {googleBusy ? "Redirecting…" : "Continue with Google (DU account)"}
      </button>
      <p className="text-[13px] text-soft mb-5">
        Only Google accounts on a du.ac.in domain will work — anything else will be signed out
        automatically.
      </p>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-rule-thin" />
        <span className="text-[13px] text-soft">or use email + password</span>
        <div className="h-px flex-1 bg-rule-thin" />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode("login"); setErr(""); }}
          className={`flex-1 py-2 text-[14px] font-semibold rounded-sm border-[1.5px] transition-colors ${mode === "login" ? "bg-ink text-paper border-ink" : "border-rule-thin text-soft"}`}
        >
          Log in
        </button>
        <button
          onClick={() => { setMode("signup"); setErr(""); }}
          className={`flex-1 py-2 text-[14px] font-semibold rounded-sm border-[1.5px] transition-colors ${mode === "signup" ? "bg-ink text-paper border-ink" : "border-rule-thin text-soft"}`}
        >
          Sign up
        </button>
      </div>

      <div className="notice-card rounded-sm p-5">
        {mode === "login" ? (
          <>
            <h3 className="font-semibold text-lg mb-4">Log in</h3>
            <Field label="Email">
              <input type="email" className="field-input w-full px-2.5 py-2 text-[15px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ramjas.du.ac.in" />
            </Field>
            <Field label="Password">
              <input type="password" className="field-input w-full px-2.5 py-2 text-[15px]" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
            </Field>
            <button onClick={login} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm mt-1 transition-transform active:scale-[0.98]">
              {busy ? "Logging in…" : "Log in"}
            </button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-lg mb-4">Create a student account</h3>
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
            <Field label="Phone" hint="Kept private — never shown on the website or shared publicly.">
              <input inputMode="tel" className="field-input w-full px-2.5 py-2 text-[15px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
            </Field>
            <Field label="Password" hint="At least 6 characters. This is what you'll log in with from now on.">
              <input type="password" className="field-input w-full px-2.5 py-2 text-[15px]" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <button onClick={signup} disabled={busy} className="btn-primary px-5 py-2.5 font-semibold rounded-sm mt-1 transition-transform active:scale-[0.98]">
              {busy ? "Creating account…" : "Create account"}
            </button>
          </>
        )}
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
