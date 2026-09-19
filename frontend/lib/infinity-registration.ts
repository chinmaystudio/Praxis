/** Frontend contract only. Replace previewGateway with a server-backed adapter. */
export type CollegeType = "" | "pccoe" | "other";
export type Participant = { name: string; collegeType: CollegeType; college: string; email: string; prn: string; year: string; branch: string };
export type RegistrationDraft = { teamName: string; leaderEmail: string; phone: string; participants: [Participant, Participant, Participant, Participant]; accepted: boolean };
export type OtpChallenge = { id: string; email: string; expiresAt: number; resendAt: number };
export type EmailProof = { email: string; token: string };
export type PaymentReceipt = { id: string; status: "paid"; amount: number; currency: "INR" };
export type RegistrationResult = { reference: string; mode: "preview" | "live"; emailStatus: "preview" | "sent" | "pending"; communityUrl: string | null };
export interface RegistrationGateway {
  mode: "preview" | "live";
  requestOtp(email: string): Promise<OtpChallenge>;
  verifyOtp(challenge: OtpChallenge, code: string): Promise<EmailProof>;
  createPayment(draft: RegistrationDraft): Promise<PaymentReceipt>;
  submit(input: { draft: RegistrationDraft; proofs: EmailProof[]; payment: PaymentReceipt | null; idempotencyKey: string }): Promise<RegistrationResult>;
}

export const blankParticipant = (): Participant => ({ name: "", collegeType: "", college: "", email: "", prn: "", year: "", branch: "" });
export const blankDraft = (): RegistrationDraft => ({ teamName: "", leaderEmail: "", phone: "", participants: [blankParticipant(), blankParticipant(), blankParticipant(), blankParticipant()], accepted: false });
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
// Fill this public setting with organizer-approved email domains before launch.
const collegeDomains = (process.env.NEXT_PUBLIC_PCCOE_EMAIL_DOMAINS ?? "").split(",").map(d => d.trim().toLowerCase()).filter(Boolean);
export const validCollegeEmail = (value: string) => validEmail(value) && (!collegeDomains.length || collegeDomains.includes(normalizeEmail(value).split("@")[1]));
export const teamFee = (draft: RegistrationDraft) => draft.participants.some(p => p.collegeType === "other") ? 200 : 0;
export const participantEmail = (draft: RegistrationDraft, index: number) => index === 0 && draft.participants[0].collegeType !== "pccoe" ? draft.leaderEmail : draft.participants[index].email;
export function cleanDraft(draft: RegistrationDraft): RegistrationDraft {
  return { ...draft, teamName: draft.teamName.trim(), leaderEmail: normalizeEmail(draft.leaderEmail), phone: draft.phone.replace(/[\s()-]/g, ""), participants: draft.participants.map((p, i) => ({ ...p, name: p.name.trim(), college: p.collegeType === "pccoe" ? "PCCOE" : p.college.trim(), prn: p.collegeType === "pccoe" ? p.prn.trim() : "", email: normalizeEmail(participantEmail(draft, i)), year: p.year.trim(), branch: p.branch.trim() })) as RegistrationDraft["participants"] };
}

export function validateRegistration(draft: RegistrationDraft, proofs: Record<number, EmailProof>, scope: "leader" | "members" | "all" = "all") {
  const errors: Record<string, string> = {};
  if (scope !== "members") {
    if (!draft.teamName.trim()) errors.teamName = "Enter your team name.";
    if (!validEmail(draft.leaderEmail)) errors.leaderEmail = "Enter a valid team leader email address.";
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(draft.phone.replace(/[\s()-]/g, ""))) errors.phone = "Enter a valid 10-digit Indian mobile number (optional +91).";
  }
  if (draft.participants.length !== 4) errors.team = "A team must contain exactly four participants.";
  draft.participants.forEach((p, i) => {
    if ((scope === "leader" && i !== 0) || (scope === "members" && i === 0)) return;
    const key = `p${i}`;
    if (!p.name.trim()) errors[`${key}.name`] = "Enter the participant’s full name.";
    if (!p.collegeType) errors[`${key}.collegeType`] = "Select PCCOE or another college.";
    if (p.collegeType === "other" && !p.college.trim()) errors[`${key}.college`] = "Enter the college name.";
    if (i === 0) {
      if (!p.year) errors[`${key}.year`] = "Select the leader’s academic year.";
      if (!p.branch.trim()) errors[`${key}.branch`] = "Enter the leader’s branch / department.";
    }
    const email = participantEmail(draft, i);
    if (!validEmail(email)) errors[`${key}.email`] = "Enter a valid email address.";
    if (p.collegeType === "pccoe") {
      if (!p.prn.trim()) errors[`${key}.prn`] = "Enter your PCCOE PRN.";
      if (!validCollegeEmail(email)) errors[`${key}.email`] = "Use an approved PCCOE email address.";
      if (!proofs[i] || proofs[i].email !== normalizeEmail(email)) errors[`${key}.verification`] = "Verify this PCCOE email with an OTP.";
    }
    const emails = draft.participants.map((person, j) => [normalizeEmail(participantEmail(draft, j)), ...(j === 0 ? [normalizeEmail(draft.leaderEmail)] : [])]);
    if (validEmail(email) && emails.some((list, j) => j !== i && list.includes(normalizeEmail(email)))) errors[`${key}.email`] = "Each participant must use a different email address.";
    if (p.collegeType === "pccoe" && p.prn.trim() && draft.participants.some((other, j) => j !== i && other.collegeType === "pccoe" && other.prn.trim().toLowerCase() === p.prn.trim().toLowerCase())) errors[`${key}.prn`] = "Each PCCOE participant needs a unique PRN.";
  });
  if (scope === "all" && !draft.accepted) errors.accepted = "Confirm that the details are correct and you accept the event rules.";
  return errors;
}

export const previewGateway: RegistrationGateway = {
  mode: "preview",
  async requestOtp(email) {
    if (!validCollegeEmail(email)) throw new Error("Enter a valid PCCOE email first.");
    return { id: `preview-${crypto.randomUUID()}`, email: normalizeEmail(email), expiresAt: Date.now() + 300000, resendAt: Date.now() + 30000 };
  },
  async verifyOtp(challenge, code) {
    if (Date.now() > challenge.expiresAt) throw new Error("This code has expired. Request a new preview code.");
    if (code !== "123456") throw new Error("Incorrect preview code. Use 123456.");
    return { email: challenge.email, token: `preview-proof-${challenge.id}` };
  },
  async createPayment(draft) {
    if (teamFee(draft) !== 200) throw new Error("This team does not require payment.");
    return { id: `PREVIEW-PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "paid", amount: 200, currency: "INR" };
  },
  async submit({ draft, proofs, payment }) {
    const mapped = Object.fromEntries(draft.participants.map((p, i) => [i, proofs.find(proof => proof.email === normalizeEmail(p.email))]).filter(([, proof]) => proof)) as Record<number, EmailProof>;
    if (Object.keys(validateRegistration(draft, mapped)).length) throw new Error("Please review the required fields and email verifications.");
    if (teamFee(draft) && (!payment || payment.status !== "paid" || payment.amount !== 200)) throw new Error("Complete the payment preview before continuing.");
    return { reference: `PREVIEW-IT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, mode: "preview", emailStatus: "preview", communityUrl: null };
  },
};
