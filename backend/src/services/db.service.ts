import fs from "fs";
import path from "path";
import crypto from "crypto";
import { RegistrationRecord, PaymentRecord, RegistrationFormData } from "../types/payment.types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "praxis_store.json");

interface StoreSchema {
  registrations: RegistrationRecord[];
  payments: PaymentRecord[];
}

function ensureStore(): StoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial: StoreSchema = { registrations: [], payments: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("[Backend DB] Failed to read store file, reinitializing:", err);
    const initial: StoreSchema = { registrations: [], payments: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function saveStore(data: StoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("[Backend DB] Failed to save store file:", err);
  }
}

/**
 * Generate a cryptographically secure, non-sequential registration code (e.g. PRX-8F3K21)
 */
export function generateRegistrationCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "PRX-";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function findConfirmedRegistration(
  email: string,
  eventSlug: string
): Promise<RegistrationRecord | null> {
  const store = ensureStore();
  const normalizedEmail = email.trim().toLowerCase();
  const match = store.registrations.find(
    (r) =>
      r.email.toLowerCase() === normalizedEmail &&
      r.eventSlug.toLowerCase() === eventSlug.toLowerCase() &&
      r.status === "confirmed"
  );
  return match || null;
}

export async function createRegistration(
  eventSlug: string,
  formData: RegistrationFormData
): Promise<RegistrationRecord> {
  const store = ensureStore();
  const now = new Date().toISOString();

  const record: RegistrationRecord = {
    id: crypto.randomUUID(),
    registrationCode: generateRegistrationCode(),
    eventId: eventSlug,
    eventSlug,
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.trim(),
    college: formData.college.trim(),
    year: formData.year.trim(),
    branch: formData.branch.trim(),
    teamName: formData.teamName?.trim(),
    teamSize: formData.teamSize || 1,
    teamMembers: formData.teamMembers || [],
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  store.registrations.push(record);
  saveStore(store);
  return record;
}

export async function createPayment(
  registrationId: string,
  eventSlug: string,
  razorpayOrderId: string,
  amount: number
): Promise<PaymentRecord> {
  const store = ensureStore();
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    id: crypto.randomUUID(),
    registrationId,
    eventId: eventSlug,
    eventSlug,
    razorpayOrderId,
    amount,
    currency: "INR",
    status: "created",
    createdAt: now,
    updatedAt: now,
  };

  store.payments.push(record);
  saveStore(store);
  return record;
}

export async function confirmPaymentAndRegistration(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  registrationId?: string
): Promise<{ registration: RegistrationRecord; payment: PaymentRecord } | null> {
  const store = ensureStore();
  const now = new Date().toISOString();

  const paymentIndex = store.payments.findIndex(
    (p) =>
      p.razorpayOrderId === razorpayOrderId ||
      (registrationId && p.registrationId === registrationId)
  );

  if (paymentIndex === -1) {
    console.warn(`[Backend DB] Payment record not found for order ${razorpayOrderId}`);
    return null;
  }

  const payment = store.payments[paymentIndex];
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = "paid";
  payment.updatedAt = now;

  const regIndex = store.registrations.findIndex((r) => r.id === payment.registrationId);
  if (regIndex === -1) {
    console.warn(`[Backend DB] Registration record not found: ${payment.registrationId}`);
    return null;
  }

  const registration = store.registrations[regIndex];
  registration.status = "confirmed";
  registration.updatedAt = now;

  saveStore(store);
  return { registration, payment };
}

export async function getRegistrationDetails(
  idOrCode: string
): Promise<{ registration: RegistrationRecord; payment?: PaymentRecord } | null> {
  const store = ensureStore();
  const registration = store.registrations.find(
    (r) => r.id === idOrCode || r.registrationCode === idOrCode
  );

  if (!registration) return null;

  const payment = store.payments.find((p) => p.registrationId === registration.id);
  return { registration, payment };
}

export async function markPaymentFailed(razorpayOrderId: string): Promise<void> {
  const store = ensureStore();
  const payment = store.payments.find((p) => p.razorpayOrderId === razorpayOrderId);
  if (payment) {
    payment.status = "failed";
    payment.updatedAt = new Date().toISOString();
    saveStore(store);
  }
}
