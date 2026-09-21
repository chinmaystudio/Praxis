import "dotenv/config";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { RegistrationRecord, PaymentRecord, RegistrationFormData } from "../types/payment.types.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

export async function verifiedGoogleLeader(accessToken: string, email: string): Promise<string | null> {
  if (!accessToken) return null;
  const { data, error } = await db.auth.getUser(accessToken);
  if (error || !data.user || !data.user.email_confirmed_at) return null;
  if (data.user.email?.toLowerCase() !== email.toLowerCase()) return null;
  const identities = data.user.identities || [];
  if (!identities.some(identity => identity.provider === "google")) return null;
  return data.user.id;
}

function result<T>(value: { data: T | null; error: { message: string } | null }): T {
  if (value.error) throw new Error(value.error.message);
  if (!value.data) throw new Error("Database returned no record");
  return value.data;
}

function registration(row: any): RegistrationRecord {
  return { id: row.id, registrationCode: row.registration_code, eventId: row.event_id,
    eventSlug: row.event_slug, name: row.lead_name, email: row.lead_email,
    phone: row.lead_phone, college: row.college, year: row.year_of_study,
    branch: row.department, teamName: row.team_name ?? undefined, teamSize: row.team_size,
    teamMembers: row.custom_fields?.teamMembers ?? [], status: row.status,
    createdAt: row.created_at, updatedAt: row.updated_at };
}

function payment(row: any): PaymentRecord {
  return { id: row.id, registrationId: row.registration_id, eventId: row.event_id,
    eventSlug: row.event_slug, razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id ?? undefined,
    razorpaySignature: row.razorpay_signature ?? undefined,
    amount: Number(row.amount), currency: row.currency, status: row.status,
    createdAt: row.created_at, updatedAt: row.updated_at };
}

export function generateRegistrationCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return "PRX-" + Array.from(crypto.randomBytes(6), byte => chars[byte % chars.length]).join("");
}

export async function findConfirmedRegistration(email: string, eventSlug: string): Promise<RegistrationRecord | null> {
  const { data, error } = await db.from("registrations").select("*")
    .eq("lead_email", email.trim().toLowerCase()).eq("event_slug", eventSlug)
    .eq("status", "confirmed").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? registration(data) : null;
}

export async function createRegistration(eventSlug: string, form: RegistrationFormData): Promise<RegistrationRecord> {
  const event = result<any>(await db.from("events").select("id").eq("slug", eventSlug).single());
  const row = result(await db.from("registrations").insert({
    registration_code: generateRegistrationCode(), event_id: event.id, event_slug: eventSlug,
    lead_name: form.name.trim(), lead_email: form.email.trim().toLowerCase(),
    lead_phone: form.phone.trim(), college: form.college.trim(), department: form.branch.trim(),
    year_of_study: form.year.trim(), team_name: form.teamName?.trim() || null,
    team_size: form.teamSize || 1, custom_fields: { teamMembers: form.teamMembers || [] },
    status: "pending"
  }).select().single());
  return registration(row);
}

export async function createPayment(registrationId: string, eventSlug: string, orderId: string, amount: number): Promise<PaymentRecord> {
  const reg = result<any>(await db.from("registrations").select("event_id").eq("id", registrationId).single());
  const row = result(await db.from("payments").insert({ registration_id: registrationId,
    event_id: reg.event_id, event_slug: eventSlug, razorpay_order_id: orderId,
    amount, currency: "INR", status: "created" }).select().single());
  return payment(row);
}

export async function getPaymentByOrder(orderId: string): Promise<PaymentRecord | null> {
  const { data, error } = await db.from("payments").select("*")
    .eq("razorpay_order_id", orderId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? payment(data) : null;
}

export async function confirmPaymentAndRegistration(orderId: string, paymentId: string, signature: string): Promise<{ registration: RegistrationRecord; payment: PaymentRecord; alreadyPaid: boolean } | null> {
  const { data, error } = await db.rpc("confirm_paid_registration", {
    p_order_id: orderId, p_payment_id: paymentId, p_signature: signature
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { registration: registration(data.registration), payment: payment(data.payment), alreadyPaid: data.already_paid };
}

export async function getRegistrationDetails(idOrCode: string): Promise<{ registration: RegistrationRecord; payment?: PaymentRecord } | null> {
  const column = /^[0-9a-f-]{36}$/i.test(idOrCode) ? "id" : "registration_code";
  const { data, error } = await db.from("registrations").select("*").eq(column, idOrCode).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { data: pay, error: payError } = await db.from("payments").select("*").eq("registration_id", data.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (payError) throw new Error(payError.message);
  return { registration: registration(data), payment: pay ? payment(pay) : undefined };
}

export async function markPaymentFailed(orderId: string): Promise<void> {
  const { error } = await db.from("payments").update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("razorpay_order_id", orderId).neq("status", "paid");
  if (error) throw new Error(error.message);
}

export async function receiptWasSent(registrationId: string): Promise<boolean> {
  const row = result<any>(await db.from("registrations").select("custom_fields").eq("id", registrationId).single());
  return Boolean(row.custom_fields?.receipt_sent_at);
}

export async function markReceiptSent(registrationId: string): Promise<void> {
  const row = result<any>(await db.from("registrations").select("custom_fields").eq("id", registrationId).single());
  const { error } = await db.from("registrations").update({
    custom_fields: { ...row.custom_fields, receipt_sent_at: new Date().toISOString() }
  }).eq("id", registrationId);
  if (error) throw new Error(error.message);
}
