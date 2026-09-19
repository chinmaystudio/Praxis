"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { INFINITY_TRIALS as event } from "@/lib/infinity-trials";
import { blankDraft, cleanDraft, normalizeEmail, participantEmail, previewGateway, teamFee, validCollegeEmail, validateRegistration, type EmailProof, type OtpChallenge, type Participant, type PaymentReceipt, type RegistrationDraft, type RegistrationGateway, type RegistrationResult } from "@/lib/infinity-registration";
import styles from "./registration.module.css";

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className={styles.field}><label htmlFor={id}>{label} <span aria-hidden="true">*</span></label>{children}{error ? <p id={`${id}-hint`} className={styles.error}>{error}</p> : hint ? <p id={`${id}-hint`} className={styles.hint}>{hint}</p> : null}</div>;
}

function EmailVerification({ email, index, proof, gateway, onVerify, error }: { email: string; index: number; proof?: EmailProof; gateway: RegistrationGateway; onVerify: (proof: EmailProof) => void; error?: string }) {
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => { if (!challenge) return; setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [challenge]);
  const verified = proof?.email === normalizeEmail(email);
  const cooldown = challenge ? Math.max(0, Math.ceil((challenge.resendAt - now) / 1000)) : 0;
  const expired = !!challenge && now >= challenge.expiresAt;
  async function send() {
    setMessage(""); setBusy(true);
    try { setChallenge(await gateway.requestOtp(normalizeEmail(email))); setCode(""); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not request a code. Please retry."); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (!challenge) return;
    setBusy(true); setMessage("");
    try { onVerify(await gateway.verifyOtp(challenge, code)); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not verify this code. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className={`${styles.otp} ${verified ? styles.verified : ""}`} id={`p${index}.verification`} tabIndex={-1} aria-invalid={!!error}>
    {verified ? <p role="status">✓ {gateway.mode === "preview" ? "Email verification simulated" : "PCCOE email verified"}</p> : <>
      <div className={styles.otpHeading}><span>Verify this PCCOE email <b>*</b></span><button type="button" className={styles.smallButton} disabled={busy || !validCollegeEmail(email) || cooldown > 0} onClick={send}>{busy ? "Please wait…" : cooldown > 0 ? `Resend in ${cooldown}s` : challenge ? "Resend code" : gateway.mode === "preview" ? "Get preview code" : "Send OTP"}</button></div>
      {challenge && <><p className={styles.hint}>{gateway.mode === "preview" ? <>No email sent. Preview code: <strong>123456</strong>. Expires in 5 minutes.</> : `A six-digit code was sent to ${challenge.email}.`}</p><div className={styles.otpInputs}><label className={styles.srOnly} htmlFor={`otp-${index}`}>Verification code for participant {index + 1}</label><input id={`otp-${index}`} value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" onChange={e => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={!!message || expired} /><button type="button" className={styles.smallButton} disabled={busy || code.length !== 6 || expired} onClick={verify}>Verify code</button></div></>}
      {(message || expired || error) && <p className={styles.error} role="alert">{message || (expired ? "Code expired. Request a new code." : error)}</p>}
    </>}
  </div>;
}

export default function RegistrationForm({ gateway = previewGateway }: { gateway?: RegistrationGateway }) {
  const [draft, setDraft] = useState<RegistrationDraft>(blankDraft);
  const [proofs, setProofs] = useState<Record<number, EmailProof>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [payment, setPayment] = useState<PaymentReceipt | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const key = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  const fee = teamFee(draft);
  const preview = gateway.mode === "preview";
  const steps = ["Team & leader", "Team members", "Review", ...(fee ? ["Payment"] : [])];
  useEffect(() => { if (step || result) heading.current?.focus({ preventScroll: true }); }, [step, result]);
  function go(next: number) { setStep(next); setNotice(""); setErrors({}); requestAnimationFrame(() => heading.current?.scrollIntoView({ block: "start", behavior: "instant" })); }
  function change(keyName: "teamName" | "leaderEmail" | "phone" | "accepted", value: string | boolean) {
    setDraft(d => ({ ...d, [keyName]: value })); setPayment(null); key.current = "";
    setErrors(e => { const next = { ...e }; delete next[keyName]; return next; });
  }
  function changePerson(index: number, field: keyof Participant, value: string) {
    setDraft(d => { const participants = [...d.participants] as RegistrationDraft["participants"]; participants[index] = { ...participants[index], [field]: value, ...(field === "collegeType" ? { college: value === "pccoe" ? "PCCOE" : "", prn: "", email: "" } : {}) }; return { ...d, participants }; });
    if (field === "email" || field === "collegeType") setProofs(p => { const next = { ...p }; delete next[index]; return next; });
    setPayment(null); key.current = "";
    setErrors(e => { const next = { ...e }; delete next[`p${index}.${field}`]; if (field === "collegeType") Object.keys(next).filter(k => k.startsWith(`p${index}.`)).forEach(k => delete next[k]); return next; });
  }
  function check(scope: "leader" | "members" | "all") {
    const next = validateRegistration(draft, proofs, scope); setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => { const el = document.getElementById(Object.keys(next)[0]); el?.focus(); el?.scrollIntoView({ block: "center", behavior: "instant" }); }); return false; }
    return true;
  }
  async function submit() {
    if (busy || !check("all")) return;
    if (fee && !payment) { setNotice("Complete the payment step before submitting."); return; }
    setBusy(true); setNotice("");
    try { key.current ||= crypto.randomUUID(); setResult(await gateway.submit({ draft: cleanDraft(draft), proofs: Object.values(proofs), payment, idempotencyKey: key.current })); window.scrollTo(0, 0); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Registration could not be submitted. Please retry."); }
    finally { setBusy(false); }
  }
  async function pay() {
    if (busy || !check("all")) return;
    setBusy(true); setNotice("");
    try { const receipt = await gateway.createPayment(cleanDraft(draft)); if (receipt.status !== "paid" || receipt.amount !== fee || receipt.currency !== "INR") throw new Error("Payment has not been confirmed. Please retry."); setPayment(receipt); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Payment was not completed. You can retry."); }
    finally { setBusy(false); }
  }
  function input(id: string, label: string, value: string, onChange: (value: string) => void, type = "text", hint?: string) {
    return <Field id={id} label={label} error={errors[id]} hint={hint}><input id={id} name={id} type={type} value={value} required maxLength={type === "email" ? 254 : 120} autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : id.endsWith("name") ? "name" : "off"} onChange={e => onChange(e.target.value)} aria-invalid={!!errors[id]} aria-describedby={errors[id] || hint ? `${id}-hint` : undefined} /></Field>;
  }
  function person(index: number) {
    const p = draft.participants[index];
    const prefix = `p${index}`;
    return <fieldset className={styles.person} key={index}>
      <legend><span>0{index + 1}</span>{index === 0 ? "Team leader" : `Member ${index}`}<small>{index === 0 ? "YOUR POINT OF CONTACT" : "ADDITIONAL TEAMMATE"}</small></legend>
      <div className={styles.grid}>
        {input(`${prefix}.name`, index === 0 ? "Team leader name" : `Member ${index} name`, p.name, v => changePerson(index, "name", v))}
        <Field id={`${prefix}.collegeType`} label="College affiliation" error={errors[`${prefix}.collegeType`]}><select id={`${prefix}.collegeType`} value={p.collegeType} required onChange={e => changePerson(index, "collegeType", e.target.value)} aria-invalid={!!errors[`${prefix}.collegeType`]} aria-describedby={errors[`${prefix}.collegeType`] ? `${prefix}.collegeType-hint` : undefined}><option value="">Select your college</option><option value="pccoe">PCCOE</option><option value="other">Another college</option></select></Field>
        {p.collegeType === "pccoe" ? <Field id={`${prefix}.college`} label="College name"><input id={`${prefix}.college`} value="PCCOE" readOnly required /></Field> : p.collegeType === "other" ? input(`${prefix}.college`, "College name", p.college, v => changePerson(index, "college", v)) : null}
        {p.collegeType === "pccoe" && input(`${prefix}.prn`, "PCCOE PRN", p.prn, v => changePerson(index, "prn", v), "text", "Enter the PRN shown on your college records.")}
        {index === 0 && <>{input("leaderEmail", "Team leader email ID", draft.leaderEmail, v => change("leaderEmail", v), "email", "Registration updates and confirmation will go to this address.")}{input("phone", "Team leader phone number", draft.phone, v => change("phone", v), "tel", "10-digit Indian mobile number, with optional +91.")}</>}
        {(index > 0 || p.collegeType === "pccoe") && input(`${prefix}.email`, p.collegeType === "pccoe" ? "PCCOE email ID" : "Email ID", p.email, v => changePerson(index, "email", v), "email", p.collegeType === "pccoe" ? "Use this participant’s college-issued email address." : "Use this participant’s own email address.")}
        {index === 0 && <><Field id={`${prefix}.year`} label="Year" error={errors[`${prefix}.year`]}><select id={`${prefix}.year`} required value={p.year} onChange={e => changePerson(index, "year", e.target.value)} aria-invalid={!!errors[`${prefix}.year`]} aria-describedby={errors[`${prefix}.year`] ? `${prefix}.year-hint` : undefined}><option value="">Select academic year</option>{["First year", "Second year", "Third year", "Fourth year", "Postgraduate", "Other"].map(year => <option key={year}>{year}</option>)}</select></Field>{input(`${prefix}.branch`, "Branch / department", p.branch, v => changePerson(index, "branch", v))}</>}
      </div>
      {p.collegeType === "pccoe" && <EmailVerification key={normalizeEmail(p.email)} email={p.email} index={index} proof={proofs[index]} gateway={gateway} onVerify={proof => { setProofs(prev => ({ ...prev, [index]: proof })); setErrors(prev => { const next = { ...prev }; delete next[`${prefix}.verification`]; return next; }); }} error={errors[`${prefix}.verification`]} />}
    </fieldset>;
  }
  const cleaned = cleanDraft(draft);
  const teamReview = <div className={styles.reviewMembers}>{cleaned.participants.map((p, i) => <div key={i}><span>0{i + 1}</span><div><strong>{p.name}</strong><small>{i === 0 ? "Team leader" : `Member ${i}`} · {p.college}</small><p>{p.email}</p>{p.prn && <p>PRN: {p.prn}</p>}</div>{p.collegeType === "pccoe" && <b>{preview ? "OTP preview ✓" : "Verified ✓"}</b>}</div>)}</div>;

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>PRAXIS <span>2026</span></Link><Link href="/events/infinity-trials">← Back to Infinity Trials</Link></header>
    <div className={styles.layout}>
      <aside className={styles.aside}><span className={styles.kicker}>THE INFINITY TRIALS</span><h1>Four players.<br /><em>One alliance.</em></h1><p>Your journey to the Endgame starts with your team.</p><div className={styles.miniStones} aria-hidden="true">{["#45b7ff", "#ae6bff", "#ff5773", "#ffd251", "#54dba0", "#ffa65d"].map(color => <i key={color} style={{ background: color, boxShadow: `0 0 18px ${color}44` }} />)}</div><dl><div><dt>EVENT DATES</dt><dd>{event.date}</dd></div><div><dt>LOCATION</dt><dd>{event.venue}</dd></div><div><dt>TEAM SIZE</dt><dd>1 leader + 3 members</dd></div></dl><div className={styles.feeCard}><span>YOUR TEAM’S ENTRY</span><strong>{draft.participants.some(p => !p.collegeType) ? "From free" : fee ? "₹200" : "Free"}</strong><p>All four from PCCOE: free.<br />Any non-PCCOE participant: ₹200 per team.</p></div><p className={styles.privateNote}>Details stay in this browser’s memory during the preview. No registration, email, or payment is sent.</p></aside>
      <section className={styles.formCard} aria-label="Team registration">
        {preview && <div className={styles.previewBanner}><span>FRONTEND PREVIEW</span><p>Try the complete form. OTP, payment and confirmation are simulated; no real registration is created.</p></div>}
        {result ? <div className={styles.completion}><span className={styles.completeIcon}>✓</span><p className={styles.kicker}>{result.mode === "preview" ? "PREVIEW COMPLETE" : "REGISTRATION CONFIRMED"}</p><h2 ref={heading} tabIndex={-1}>{result.mode === "preview" ? "Your team is ready for review." : "Your alliance is registered."}</h2><p>{result.mode === "preview" ? "This is a registration preview. No place has been booked, no money charged, and no email sent." : `Your registration has been recorded. Confirmation email status: ${result.emailStatus}.`}</p><div className={styles.reference}><small>{preview ? "PREVIEW REFERENCE" : "REGISTRATION ID"}</small><strong>{result.reference}</strong></div><h3>{draft.teamName}</h3>{teamReview}<div className={styles.emailPreview}><h3>{preview ? "Confirmation email preview" : "Confirmation details"}</h3><p><b>To:</b> {cleaned.leaderEmail}</p><p><b>Subject:</b> Infinity Trials — {preview ? "registration preview" : "registration confirmed"}</p><p>Team: {cleaned.teamName} · Reference: {result.reference}</p><p>The confirmation includes all four participant records shown above, college details, PRNs where applicable, and the team’s entry status ({fee ? `₹200 — ${preview ? "payment simulated" : "paid"}` : "free"}).</p>{result.communityUrl ? <a href={result.communityUrl} target="_blank" rel="noreferrer">Join the event community ↗</a> : <p>Community joining link: to be provided by the organizers when the live service is connected.</p>}<p>Report at {event.venue} before the announced reporting time on {event.date}. Carry valid college ID when required. Read the official rulebook before attending.</p></div><Link className={styles.primary} href="/events/infinity-trials">Return to the Infinity Trail ↗</Link></div> : <>
          <ol className={styles.stepper} aria-label="Registration progress">{steps.map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined}><button type="button" disabled={i >= step || busy} onClick={() => go(i)}><span>{i < step ? "✓" : `0${i + 1}`}</span><b>{label}</b></button></li>)}</ol>
          <div className={styles.formHeading}><span>STEP 0{step + 1} OF 0{steps.length}</span><h2 ref={heading} tabIndex={-1}>{["Build your alliance.", "Meet your other three.", "One last look.", "Secure your team’s entry."][step]}</h2><p>{["Start with your team name and the leader’s details. Fields marked * are required.", "The leader is already player 01. Add exactly three more participants. Fields marked * are required.", "Check every participant, college and verified email before continuing.", "This team includes a non-PCCOE participant. The team fee is ₹200."][step]}</p></div>
          {!!Object.keys(errors).length && <div className={styles.errorSummary} role="alert"><strong>Please complete the required details.</strong><ul>{Object.entries(errors).map(([id, message]) => <li key={id}><a href={`#${id}`}>{message}</a></li>)}</ul></div>}
          {notice && <p className={styles.errorSummary} role="alert">{notice}</p>}
          <form noValidate onSubmit={e => { e.preventDefault(); if (step === 0 && check("leader")) go(1); else if (step === 1 && check("members")) go(2); else if (step === 2 && check("all")) { if (fee) go(3); else void submit(); } else if (step === 3) void submit(); }}>
            <fieldset className={styles.formFields} disabled={busy}>
              {step === 0 && <>{input("teamName", "Team name", draft.teamName, v => change("teamName", v), "text", "Choose a name your whole team will compete under.")}{person(0)}</>}
              {step === 1 && <><div className={styles.leaderSummary}><span>01 ✓</span><div><strong>{draft.participants[0].name}</strong><small>Team leader · {draft.participants[0].collegeType === "pccoe" ? "PCCOE" : draft.participants[0].college}</small></div><button type="button" onClick={() => go(0)}>Edit leader</button></div>{[1, 2, 3].map(person)}</>}
              {step === 2 && <><div className={styles.reviewTitle}><div><small>TEAM NAME</small><h3>{draft.teamName}</h3></div><button type="button" onClick={() => go(0)}>Edit team</button></div>{teamReview}<div className={styles.reviewContact}><p><b>Confirmation email:</b> {cleaned.leaderEmail}</p><p><b>Leader phone:</b> {cleaned.phone}</p><p><b>Leader year & branch:</b> {cleaned.participants[0].year} · {cleaned.participants[0].branch}</p><button type="button" onClick={() => go(1)}>Edit members</button></div><div className={styles.total}><span>{fee ? "Mixed / non-PCCOE team" : "All-PCCOE team"}</span><strong>{fee ? "₹200" : "Free"}</strong><p>{fee ? "Payment must be confirmed before registration can be completed." : "All four participants are from PCCOE. No payment step is required."}</p></div><label className={styles.consent}><input id="accepted" type="checkbox" required checked={draft.accepted} onChange={e => change("accepted", e.target.checked)} aria-invalid={!!errors.accepted} /><span>I confirm these are four different participants, the details are correct, and our team accepts the <a href={event.rulebookPath} target="_blank" rel="noreferrer">event rules</a>. *</span></label></>}
              {step === 3 && <div className={styles.payment}><span className={styles.paymentGlyph}>◇</span><h3>{payment ? (preview ? "Payment simulated" : "Payment confirmed") : "One payment. Your whole team."}</h3><p>{draft.teamName} · 4 participants</p><div className={styles.total}><span>Total team entry</span><strong>₹200</strong><p>INR · One-time payment for the entire team</p></div>{payment ? <p className={styles.paymentSuccess}>✓ {preview ? "No money charged. Preview receipt:" : "Payment receipt:"}<br />{payment.id}</p> : <><p>{preview ? "Payment preview only. No card, UPI, or bank details are collected." : "Continue to the secure payment provider to complete your payment."}</p><button type="button" className={styles.primary} onClick={pay}>{busy ? "Processing…" : preview ? "Simulate successful payment" : "Pay ₹200 securely"}</button></>}<p className={styles.hint}>Your registration can proceed only after payment is confirmed{preview ? " in this preview" : ""}.</p></div>}
              <div className={styles.formActions}>{step > 0 && <button className={styles.secondary} type="button" onClick={() => go(step - 1)}>← Back</button>}<button className={styles.primary} type="submit" disabled={busy || (step === 3 && !payment)}>{busy ? "Please wait…" : step < 2 ? "Continue →" : step === 2 && fee ? "Continue to payment →" : preview ? "Complete registration preview →" : "Confirm registration →"}</button></div>
            </fieldset>
          </form><p className={styles.help}>Need a hand? <a href={`tel:+91${event.coordinators[0].phone}`}>Contact {event.coordinators[0].name} ↗</a></p>
        </>}
      </section>
    </div><footer className={styles.footer}>PRAXIS 2026 · PCCOE <span>THE INFINITY TRIALS</span></footer>
  </main>;
}
