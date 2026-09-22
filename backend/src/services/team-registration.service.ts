import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { razorpay } from "../config/razorpay.js";
import { TEAM_EVENT_POLICIES, teamAmount } from "../config/team-events.js";
import { createPayment, createRegistration, findConfirmedRegistration, markReceiptSent } from "./db.service.js";
import { sendRegistrationConfirmationEmail } from "./email.service.js";
import { memberProofsValid } from "./member-verification.service.js";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type TeamParticipant = {
  name: string;
  email: string;
  college?: string;
  year?: string;
  branch?: string;
};
export type TeamDraft = {
  eventSlug: string;
  teamName: string;
  leaderEmail: string;
  phone: string;
  participants: TeamParticipant[];
  accepted: boolean;
};
type Proof = { email: string; token: string };
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function validateTeam(draft: TeamDraft, leaderId: string, proofs: Proof[]) {
  const policy = TEAM_EVENT_POLICIES[draft?.eventSlug];
  if (!policy) throw new Error("This team event is not configured.");
  if (!draft.accepted || !draft.teamName?.trim() || !validEmail(draft.leaderEmail) ||
      !/^(?:\+91)?[6-9]\d{9}$/.test(draft.phone?.replace(/[\s()-]/g, "") || "")) {
    throw new Error("Complete the team name, leader email, phone number, and consent.");
  }
  if (!Array.isArray(draft.participants) || draft.participants.length < policy.minMembers || draft.participants.length > policy.maxMembers) {
    throw new Error(`${policy.title} requires ${policy.minMembers === policy.maxMembers ? `exactly ${policy.minMembers}` : `${policy.minMembers} to ${policy.maxMembers}`} members.`);
  }
  const emails = draft.participants.map((person) => person.email?.trim().toLowerCase());
  if (emails[0] !== draft.leaderEmail.trim().toLowerCase()) throw new Error("The first participant must use the signed-in leader email.");
  if (new Set(emails).size !== emails.length || emails.some((email) => !validEmail(email))) throw new Error("Every participant needs a unique valid email.");
  if (draft.participants.some((person) => !person.name?.trim())) throw new Error("Enter every participant's full name.");
  if (!draft.participants[0].college?.trim() || !draft.participants[0].year?.trim() || !draft.participants[0].branch?.trim()) {
    throw new Error("Complete the leader's college, year, and branch.");
  }
  if (!(await memberProofsValid(leaderId, emails.slice(1), proofs))) throw new Error("Verify every member email before registration.");
  return { policy, emails, amount: teamAmount(policy, emails) };
}

async function saveTeam(draft: TeamDraft, leaderId: string, amount: number) {
  const leader = draft.participants[0];
  const existing = await findConfirmedRegistration(draft.leaderEmail, draft.eventSlug);
  if (existing) throw new Error(`This leader is already registered for this event (${existing.registrationCode}).`);
  const record = await createRegistration(draft.eventSlug, {
    name: leader.name,
    email: draft.leaderEmail,
    phone: draft.phone.replace(/[\s()-]/g, ""),
    college: leader.college || "Not provided",
    year: leader.year || "Not provided",
    branch: leader.branch || "Not provided",
    teamName: draft.teamName,
    teamSize: draft.participants.length,
    teamMembers: draft.participants.map((person) => person.name),
  });
  const { error } = await db.from("registrations").update({ custom_fields: {
    leader_user_id: leaderId,
    participants: draft.participants,
    pricing: { amount, basis: "verified_email_domain" },
  } }).eq("id", record.id);
  if (error) throw new Error(error.message);
  return record;
}

async function sendConfirmation(record: Awaited<ReturnType<typeof saveTeam>>, draft: TeamDraft, title: string, amount: number) {
  const sent = await sendRegistrationConfirmationEmail({
    participantName: record.name,
    email: record.email,
    eventTitle: title,
    eventSlug: record.eventSlug,
    registrationCode: record.registrationCode,
    college: record.college,
    amountPaid: amount,
    paymentId: amount ? "PENDING" : "FREE",
    recipients: draft.participants,
    teamName: draft.teamName,
    communityUrl: TEAM_EVENT_POLICIES[record.eventSlug]?.whatsappUrl,
  });
  if (sent.success) await markReceiptSent(record.id);
  return sent.success ? "sent" as const : "pending" as const;
}

export async function registerFreeTeam(draft: TeamDraft, leaderId: string, proofs: Proof[]) {
  const { policy, amount } = await validateTeam(draft, leaderId, proofs);
  if (amount !== 0) throw new Error(`This team requires a ₹${amount} payment.`);
  const record = await saveTeam(draft, leaderId, amount);
  const { error } = await db.from("registrations").update({ status: "confirmed" }).eq("id", record.id);
  if (error) throw new Error(error.message);
  return { reference: record.registrationCode, amount, emailStatus: await sendConfirmation(record, draft, policy.title, amount), communityUrl: policy.whatsappUrl };
}

export async function createTeamOrder(draft: TeamDraft, leaderId: string, proofs: Proof[]) {
  const { policy, amount } = await validateTeam(draft, leaderId, proofs);
  if (amount <= 0) throw new Error("This team has free entry.");
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `praxis_${policy.slug.slice(0, 10)}_${Date.now()}`,
    notes: { eventSlug: policy.slug, leaderEmail: draft.leaderEmail, teamName: draft.teamName },
  });
  const record = await saveTeam(draft, leaderId, amount);
  await createPayment(record.id, policy.slug, order.id, amount);
  return { orderId: order.id, registrationId: record.id, keyId: process.env.RAZORPAY_KEY_ID, amount: amount * 100, currency: "INR" };
}
