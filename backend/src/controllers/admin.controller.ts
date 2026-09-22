import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const ADMIN_EMAIL = "chinmay.joshi25@pccoepune.org";

export async function registrations(req: Request, res: Response): Promise<void> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || auth.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  const [{ data: rows, error }, { data: payments, error: paymentError }] = await Promise.all([
    db.from("registrations").select("*").order("created_at", { ascending: false }),
    db.from("payments").select("registration_id,razorpay_order_id,razorpay_payment_id,amount,currency,status,created_at").order("created_at", { ascending: false }),
  ]);
  if (error || paymentError) {
    console.error("[Admin registrations]", error || paymentError);
    res.status(500).json({ error: "Could not load registrations." });
    return;
  }
  const paymentsByRegistration = new Map<string, unknown>();
  for (const payment of payments || []) if (!paymentsByRegistration.has(payment.registration_id)) paymentsByRegistration.set(payment.registration_id, payment);
  res.setHeader("Cache-Control", "no-store");
  res.json({
    syncedAt: new Date().toISOString(),
    registrations: (rows || []).map((row) => ({
      id: row.id,
      registrationCode: row.registration_code,
      eventSlug: row.event_slug,
      name: row.lead_name ?? row.name,
      email: row.lead_email ?? row.email,
      phone: row.lead_phone ?? row.phone,
      college: row.college,
      year: row.year_of_study ?? row.year,
      branch: row.department ?? row.branch,
      teamName: row.team_name,
      teamSize: row.team_size ?? 1,
      participants: row.custom_fields?.participants ?? row.custom_fields?.teamMembers ?? row.team_members ?? [],
      status: row.status,
      createdAt: row.created_at,
      payment: paymentsByRegistration.get(row.id) ?? null,
    })),
  });
}
