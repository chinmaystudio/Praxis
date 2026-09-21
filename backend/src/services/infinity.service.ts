import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { createRegistration, createPayment, markReceiptSent } from "./db.service.js";
import { sendRegistrationConfirmationEmail } from "./email.service.js";
import { razorpay } from "../config/razorpay.js";
import { memberProofsValid } from "./member-verification.service.js";
import { isPccoeEmail } from "../config/team-events.js";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
type Participant = { name: string; email: string; collegeType: "pccoe" | "other"; college: string; prn: string; year: string; branch: string };
export type TeamDraft = { teamName: string; leaderEmail: string; phone: string; participants: Participant[]; accepted: boolean };
type Proof = { email: string; token: string };
const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function validateTeam(draft: TeamDraft, leaderId: string, proofs: Proof[]): Promise<number> {
  if (!draft || !draft.accepted || !draft.teamName?.trim() || !emailValid(draft.leaderEmail) || !/^(?:\+91)?[6-9]\d{9}$/.test(draft.phone)) throw new Error("Invalid team details.");
  if (!Array.isArray(draft.participants) || draft.participants.length !== 4) throw new Error("Exactly four participants are required.");
  const emails = draft.participants.map(p => p.email?.trim().toLowerCase());
  if (new Set(emails).size !== 4 || emails.some(email => !emailValid(email))) throw new Error("Every participant needs a unique valid email.");
  if (draft.participants.some(p => !p.name?.trim() || !["pccoe", "other"].includes(p.collegeType) || !p.college?.trim())) throw new Error("Complete every participant’s name and college.");
  if (!draft.participants[0].year?.trim() || !draft.participants[0].branch?.trim()) throw new Error("Complete the leader’s year and branch.");
  if (draft.participants.some(p => p.collegeType === "pccoe" && !p.prn?.trim())) throw new Error("PCCOE participants need a PRN.");
  if (draft.participants.some((p, index) => {
    const pccoe = isPccoeEmail(emails[index]);
    return (p.collegeType === "pccoe" && !pccoe) || (p.collegeType === "other" && pccoe);
  })) throw new Error("PCCOE status must match each participant's verified @pccoepune.org email.");
  if (!(await memberProofsValid(leaderId, emails.slice(1), proofs))) throw new Error("Verify all three member email addresses before registration.");
  return emails.some(email => !isPccoeEmail(email)) ? 200 : 0;
}

async function saveTeam(draft: TeamDraft, leaderId: string) {
  const leader = draft.participants[0];
  const record = await createRegistration("infinity-trials", {
    name: leader.name, email: draft.leaderEmail, phone: draft.phone,
    college: leader.college, year: leader.year, branch: leader.branch,
    teamName: draft.teamName, teamSize: 4, teamMembers: draft.participants.map(p => p.name),
  });
  const { error: regError } = await db.from("registrations").update({ custom_fields: {
    leader_user_id: leaderId, participants: draft.participants,
  } }).eq("id", record.id);
  if (regError) throw new Error(regError.message);
  const { error: teamError } = await db.from("registrations_infinity_trials").insert({
    registration_id: record.id, team_name: draft.teamName, team_members: draft.participants,
  });
  if (teamError) throw new Error(teamError.message);
  return record;
}

export async function registerFreeTeam(draft: TeamDraft, leaderId: string, proofs: Proof[]) {
  if (await validateTeam(draft, leaderId, proofs) !== 0) throw new Error("This team requires ₹200 payment.");
  const record = await saveTeam(draft, leaderId);
  const { error } = await db.from("registrations").update({ status: "confirmed" }).eq("id", record.id);
  if (error) throw new Error(error.message);
  const sent = await sendRegistrationConfirmationEmail({
    participantName: record.name, email: record.email, eventTitle: "Infinity Trials",
    eventSlug: "infinity-trials", registrationCode: record.registrationCode,
    college: record.college, amountPaid: 0, paymentId: "FREE",
  });
  if (sent.success) await markReceiptSent(record.id);
  return { reference: record.registrationCode, emailStatus: sent.success ? "sent" : "pending" };
}

export async function createPaidTeamOrder(draft: TeamDraft, leaderId: string, proofs: Proof[]) {
  if (await validateTeam(draft, leaderId, proofs) !== 200) throw new Error("This team has free entry.");
  const order = await razorpay.orders.create({ amount: 20000, currency: "INR",
    receipt: `praxis_it_${Date.now()}`, notes: { eventSlug: "infinity-trials", leaderEmail: draft.leaderEmail } });
  const record = await saveTeam(draft, leaderId);
  await createPayment(record.id, "infinity-trials", order.id, 200);
  return { orderId: order.id, registrationId: record.id, keyId: process.env.RAZORPAY_KEY_ID,
    amount: 20000, currency: "INR" };
}
