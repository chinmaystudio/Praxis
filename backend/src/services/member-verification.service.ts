import "dotenv/config";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendMemberVerificationEmail } from "./email.service.js";

const secret = process.env.OTP_SECRET;
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!secret || !url || !key) throw new Error("OTP_SECRET and Supabase server credentials are required");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const normalize = (email: string) => email.trim().toLowerCase();
const hash = (id: string, code: string) => crypto.createHmac("sha256", secret).update(`${id}:${code}`).digest("hex");

export async function requestMemberCode(leaderId: string, email: string) {
  const normalized = normalize(email);
  const { data: last, error: readError } = await db.from("member_email_challenges")
    .select("created_at").eq("leader_user_id", leaderId).eq("email", normalized)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (last && Date.now() - new Date(last.created_at).getTime() < 60_000) {
    throw new Error("Please wait one minute before requesting another code.");
  }
  const id = crypto.randomUUID();
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const { error } = await db.from("member_email_challenges").insert({
    id, leader_user_id: leaderId, email: normalized, code_hash: hash(id, code), expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  try { await sendMemberVerificationEmail(normalized, code); }
  catch (sendError) {
    await db.from("member_email_challenges").delete().eq("id", id);
    throw sendError;
  }
  return { id, email: normalized, expiresAt: new Date(expiresAt).getTime(), resendAt: Date.now() + 60_000 };
}

export async function verifyMemberCode(leaderId: string, id: string, code: string) {
  const { data, error } = await db.from("member_email_challenges").select("*")
    .eq("id", id).eq("leader_user_id", leaderId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || new Date(data.expires_at).getTime() < Date.now() || data.attempt_count >= 5) {
    throw new Error("This code expired or has too many attempts.");
  }
  const { error: updateError } = await db.from("member_email_challenges")
    .update({ attempt_count: data.attempt_count + 1 }).eq("id", id);
  if (updateError) throw new Error(updateError.message);
  const expected = Buffer.from(data.code_hash, "hex");
  const received = Buffer.from(hash(id, code), "hex");
  if (!crypto.timingSafeEqual(expected, received)) throw new Error("Incorrect verification code.");
  const { error: verifyError } = await db.from("member_email_challenges")
    .update({ verified_at: new Date().toISOString() }).eq("id", id);
  if (verifyError) throw new Error(verifyError.message);
  return { email: data.email as string, token: id };
}

export async function memberProofsValid(leaderId: string, members: string[], proofs: { email: string; token: string }[]): Promise<boolean> {
  for (const email of members) {
    const proof = proofs.find(item => normalize(item.email) === normalize(email));
    if (!proof) return false;
    const { data, error } = await db.from("member_email_challenges").select("email,verified_at")
      .eq("id", proof.token).eq("leader_user_id", leaderId).maybeSingle();
    if (error || !data?.verified_at || normalize(data.email) !== normalize(email)) return false;
    if (Date.now() - new Date(data.verified_at).getTime() > 24 * 60 * 60_000) return false;
  }
  return true;
}
