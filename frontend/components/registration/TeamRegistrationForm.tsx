"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { isPccoeEmail, payableAmount, TeamEventPolicy } from "@/lib/team-events";
import styles from "@/components/infinity-trials/registration.module.css";

type Participant = { name: string; email: string };
type Challenge = { id: string; email: string; expiresAt: number; resendAt: number };
type Proof = { email: string; token: string };
type Checkout = new (options: Record<string, unknown>) => { open(): void };
const blank = (): Participant => ({ name: "", email: "" });
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function TeamRegistrationForm({ policy }: { policy: TeamEventPolicy }) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(() => Array.from({ length: policy.minMembers }, blank));
  const [proofs, setProofs] = useState<Record<number, Proof>>({});
  const [challenges, setChallenges] = useState<Record<number, Challenge>>({});
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const emails = participants.map((person, index) => index === 0 ? leaderEmail.trim().toLowerCase() : person.email.trim().toLowerCase());
  const hasAllEmails = emails.every(validEmail);
  const amount = useMemo(() => payableAmount(policy, emails), [policy, emails.join("|")]);

  useEffect(() => {
    const auth = supabaseBrowser().auth;
    void auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email || null));
    const { data } = auth.onAuthStateChange((_event, session) => setSignedInEmail(session?.user.email || null));
    return () => data.subscription.unsubscribe();
  }, []);

  function resize(size: number) {
    setParticipants((current) => Array.from({ length: size }, (_, index) => current[index] || blank()));
    setProofs((current) => Object.fromEntries(Object.entries(current).filter(([index]) => Number(index) < size)));
  }
  function changeParticipant(index: number, field: keyof Participant, value: string) {
    setParticipants((current) => current.map((item, position) => position === index ? { ...item, [field]: value } : item));
    if (field === "email") setProofs((current) => { const next = { ...current }; delete next[index]; return next; });
  }
  async function activeSession() {
    const { data } = await supabaseBrowser().auth.getSession();
    if (!data.session || data.session.user.email?.toLowerCase() !== leaderEmail.trim().toLowerCase()) throw new Error("Sign in with Google using the team leader email.");
    return data.session;
  }
  async function post(path: string, body: unknown) {
    const session = await activeSession();
    const response = await fetch(`/api/team/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || "Request failed.");
    return payload;
  }
  async function sendOtp(index: number) {
    setBusy(true); setMessage("");
    try { const body = await post("otp/request", { leaderEmail, email: participants[index].email }); setChallenges((current) => ({ ...current, [index]: body.challenge })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not send the code."); }
    finally { setBusy(false); }
  }
  async function verifyOtp(index: number) {
    setBusy(true); setMessage("");
    try {
      const body = await post("otp/verify", { leaderEmail, challengeId: challenges[index]?.id, code: codes[index] });
      setProofs((current) => ({ ...current, [index]: body.proof }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not verify the code."); }
    finally { setBusy(false); }
  }
  function validationError() {
    if (!teamName.trim() || !validEmail(leaderEmail) || !/^(?:\+91)?[6-9]\d{9}$/.test(phone.replace(/[\s()-]/g, "")) || !college.trim() || !year || !branch.trim()) return "Complete all leader and team fields.";
    if (participants.some((person, index) => !person.name.trim() || (index > 0 && !validEmail(person.email)))) return "Enter a name and valid email for every member.";
    if (new Set(emails).size !== emails.length) return "Each member must use a different email.";
    if (participants.slice(1).some((_person, offset) => proofs[offset + 1]?.email !== emails[offset + 1])) return "Verify every member email with its OTP.";
    if (!accepted) return "Accept the event rules before registering.";
    return "";
  }
  function draft() {
    return { eventSlug: policy.slug, teamName: teamName.trim(), leaderEmail: leaderEmail.trim().toLowerCase(), phone: phone.replace(/[\s()-]/g, ""), accepted,
      participants: participants.map((person, index) => ({ name: person.name.trim(), email: emails[index], ...(index === 0 ? { college: college.trim(), year, branch: branch.trim() } : {}) })) };
  }
  async function verifyPayment(payment: Record<string, string>) {
    const response = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || "Payment verification failed.");
    router.push(`/payment/success?reg=${encodeURIComponent(body.registrationCode)}&event=${encodeURIComponent(policy.slug)}&pay=${encodeURIComponent(body.paymentId)}`);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const error = validationError(); if (error) { setMessage(error); return; }
    setBusy(true); setMessage("");
    try {
      const input = { draft: draft(), proofs: Object.values(proofs) };
      if (amount === 0) {
        const body = await post("free", input);
        router.push(`/payment/success?reg=${encodeURIComponent(body.reference)}&event=${encodeURIComponent(policy.slug)}&pay=FREE`);
        return;
      }
      const order = await post("create-order", input);
      const Razorpay = (window as unknown as { Razorpay?: Checkout }).Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout did not load. Refresh and try again.");
      new Razorpay({ key: order.keyId, amount: order.amount, currency: "INR", order_id: order.orderId, name: "Praxis 2026", description: `${policy.title} team registration`, prefill: { email: leaderEmail, contact: phone }, theme: { color: policy.accent },
        handler: (payment: Record<string, string>) => void verifyPayment(payment).catch((failure) => { setMessage(failure.message); setBusy(false); }), modal: { ondismiss: () => setBusy(false) } }).open();
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "Registration failed."); setBusy(false); }
  }

  return <main className={styles.page}>
    <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    <header className={styles.header}><Link href="/" className={styles.brand}>PRAXIS <span>2026</span></Link><Link href="/events">← All events</Link></header>
    <div className={styles.layout} style={{ gridTemplateColumns: "minmax(0, 820px)" }}><section className={styles.formCard} style={{ paddingTop: 30 }}>
      <div className={styles.formHeading}><span>SECURE TEAM REGISTRATION</span><h2>{policy.title}</h2><p>The team leader signs in with Google. Every other member verifies their email with an OTP. PCCOE entry status is determined only from a verified <b>@pccoepune.org</b> address.</p></div>
      {message && <p className={styles.errorSummary} role="alert">{message}</p>}
      <form onSubmit={submit}><fieldset className={styles.formFields} disabled={busy}>
        <div className={styles.grid}>
          <label className={styles.field}>Team name *<input value={teamName} onChange={(e) => setTeamName(e.target.value)} required /></label>
          {policy.minMembers !== policy.maxMembers && <label className={styles.field}>Team size *<select value={participants.length} onChange={(e) => resize(Number(e.target.value))}>{Array.from({ length: policy.maxMembers - policy.minMembers + 1 }, (_, i) => policy.minMembers + i).map((size) => <option key={size}>{size}</option>)}</select></label>}
          <label className={styles.field}>Leader Google email *<input type="email" value={leaderEmail} onChange={(e) => setLeaderEmail(e.target.value)} required /></label>
          <label className={styles.field}>Phone *<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
          <label className={styles.field}>College *<input value={college} onChange={(e) => setCollege(e.target.value)} required /></label>
          <label className={styles.field}>Year *<select value={year} onChange={(e) => setYear(e.target.value)} required><option value="">Select year</option>{["First year","Second year","Third year","Fourth year","Postgraduate","Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className={styles.field}>Branch *<input value={branch} onChange={(e) => setBranch(e.target.value)} required /></label>
        </div>
        <div className={styles.leaderSummary} style={{ marginTop: 22 }}><div><strong>{signedInEmail ? `Google account: ${signedInEmail}` : "Team leader Google sign-in required"}</strong><small>The signed-in email must match the leader email above.</small></div><button type="button" onClick={() => void supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } })}>Sign in with Google</button></div>
        {participants.map((person, index) => <fieldset className={styles.person} key={index}><legend><span>0{index + 1}</span>{index === 0 ? "Team leader" : `Member ${index}`}</legend><div className={styles.grid}>
          <label className={styles.field}>Full name *<input value={person.name} onChange={(e) => changeParticipant(index, "name", e.target.value)} required /></label>
          {index === 0 ? <label className={styles.field}>Verified through Google<input value={leaderEmail} readOnly /></label> : <label className={styles.field}>Member email *<input type="email" value={person.email} onChange={(e) => changeParticipant(index, "email", e.target.value)} required /></label>}
        </div>{index > 0 && <div className={`${styles.otp} ${proofs[index]?.email === emails[index] ? styles.verified : ""}`}>{proofs[index]?.email === emails[index] ? <p>✓ Email verified · {isPccoeEmail(emails[index]) ? "PCCOE member" : "External member"}</p> : <><button type="button" className={styles.smallButton} onClick={() => void sendOtp(index)}>Send OTP</button>{challenges[index] && <><input value={codes[index] || ""} onChange={(e) => setCodes((current) => ({ ...current, [index]: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="6-digit code" /><button type="button" className={styles.smallButton} onClick={() => void verifyOtp(index)}>Verify</button></>}</>}</div>}</fieldset>)}
        <div className={styles.total}><span>{!hasAllEmails ? "Registration fee" : amount ? "Registration fee" : "All members use PCCOE email"}</span><strong>{!hasAllEmails ? "—" : amount ? `₹${amount}` : "Free"}</strong><p>{!hasAllEmails ? "Enter every member email to calculate the fee." : policy.externalPricing === "team" ? `₹${policy.externalAmount} for the team if any verified member email is outside PCCOE.` : `₹${policy.externalAmount} for each verified member email outside PCCOE.`}</p></div>
        <label className={styles.consent}><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I confirm the participant details are correct and accept the <a href={policy.rulebook} target="_blank" rel="noreferrer">event rules</a>.</span></label>
        <div className={styles.formActions}><button className={styles.primary} type="submit">{busy ? "Please wait…" : !hasAllEmails ? "Complete team details" : amount ? `Pay ₹${amount} and register` : "Confirm free registration"}</button></div>
      </fieldset></form>
    </section></div>
  </main>;
}
