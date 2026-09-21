import { Request, Response } from "express";
import { razorpay, verifyRazorpaySignature, verifyWebhookSignature } from "../config/razorpay.js";
import { EVENTS } from "../config/events.js";
import {
  findConfirmedRegistration,
  createRegistration,
  createPayment,
  confirmPaymentAndRegistration,
  getRegistrationDetails,
  markPaymentFailed,
  verifiedGoogleLeader,
  receiptWasSent,
  markReceiptSent,
  getPaymentByOrder,
} from "../services/db.service.js";
import { sendRegistrationConfirmationEmail } from "../services/email.service.js";
import { TEAM_EVENT_POLICIES } from "../config/team-events.js";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "../types/payment.types.js";

/**
 * Helper to look up an event by slug
 */
function getEventBySlug(slug: string) {
  return EVENTS.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}

async function sendReceiptIfNeeded(registration: Awaited<ReturnType<typeof createRegistration>>, payment: Awaited<ReturnType<typeof createPayment>>): Promise<void> {
  if (await receiptWasSent(registration.id)) return;
  const event = getEventBySlug(registration.eventSlug);
  const sent = await sendRegistrationConfirmationEmail({
    participantName: registration.name, email: registration.email,
    eventTitle: event?.title || registration.eventSlug, eventSlug: registration.eventSlug,
    registrationCode: registration.registrationCode, college: registration.college,
    amountPaid: payment.amount, paymentId: payment.razorpayPaymentId || "",
  });
  if (!sent.success) throw new Error(sent.error || "Receipt email failed");
  await markReceiptSent(registration.id);
}

/**
 * POST /api/payments/create-order
 * Validates registration input, enforces server-authoritative pricing,
 * and initializes a Razorpay order.
 */
export async function createOrder(
  req: Request<object, object, CreateOrderRequest>,
  res: Response<CreateOrderResponse>
): Promise<void> {
  try {
    const { eventSlug, registration } = req.body;

    // 1. Validate required fields
    if (!eventSlug || typeof eventSlug !== "string") {
      res.status(400).json({ success: false, error: "Invalid or missing event slug." });
      return;
    }

    if (!registration) {
      res.status(400).json({ success: false, error: "Missing registration information." });
      return;
    }

    const name = registration.name?.trim();
    const email = registration.email?.trim().toLowerCase();
    const phone = registration.phone?.trim();
    const college = registration.college?.trim();
    const year = registration.year?.trim();
    const branch = registration.branch?.trim();

    if (!name || !email || !phone || !college || !year || !branch) {
      res.status(400).json({
        success: false,
        error: "All registration fields (Name, Email, Phone, College, Year, Branch) are required.",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: "Please enter a valid email address." });
      return;
    }

    const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
    const leaderId = await verifiedGoogleLeader(accessToken, email);
    if (!leaderId) {
      res.status(401).json({ success: false, error: "Team leader must sign in with Google using the registration email." });
      return;
    }

    // Indian phone number validation (10 digits)
    const cleanPhone = phone.replace(/^(\+91|0)/, "").replace(/[\s-]/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      res.status(400).json({
        success: false,
        error: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    // 2. Fetch server-side event configuration (SOURCE OF TRUTH)
    const event = getEventBySlug(eventSlug);
    if (!event) {
      res.status(404).json({ success: false, error: `Event "${eventSlug}" not found.` });
      return;
    }

    if (!event.registrationOpen) {
      res.status(400).json({
        success: false,
        error: `Registration for ${event.title} is currently closed.`,
      });
      return;
    }

    if (TEAM_EVENT_POLICIES[event.slug]) {
      res.status(400).json({ success: false, error: "Use the verified team registration flow for this event." });
      return;
    }

    // 3. Prevent duplicate registrations for same email + event
    const existingConfirmed = await findConfirmedRegistration(email, event.slug);
    if (existingConfirmed) {
      res.status(409).json({
        success: false,
        error: `You are already registered for ${event.title} (Registration ID: ${existingConfirmed.registrationCode}).`,
      });
      return;
    }

    // 4. Server determines price in paise (NEVER trust client amount)
    const amountInPaise = Math.round(event.price * 100);
    const receipt = `praxis_${event.slug.slice(0, 10)}_${Date.now()}`;

    // 5. Create Razorpay order
    let orderId = "";
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          eventSlug: event.slug,
          eventTitle: event.title,
          participantEmail: email,
          participantName: name,
        },
      });
      orderId = order.id;

    // 6. Record registration and payment in database
    const regRecord = await createRegistration(event.slug, {
      ...registration,
      name,
      email,
      phone: cleanPhone,
      college,
      year,
      branch,
    });

    await createPayment(regRecord.id, event.slug, orderId, event.price);

    // 7. Return clean order response
    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: "INR",
      eventSlug: event.slug,
      eventTitle: event.title,
      accent: event.accent,
      registrationId: regRecord.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: unknown) {
    console.error("[Backend Create Order API Error]", err);
    res.status(500).json({
      success: false,
      error: "Failed to initialize registration order. Please try again.",
    });
  }
}

/**
 * POST /api/payments/verify
 * Validates HMAC SHA-256 signature, marks order paid, and dispatches confirmation.
 */
export async function verifyPayment(
  req: Request<object, object, VerifyPaymentRequest>,
  res: Response<VerifyPaymentResponse>
): Promise<void> {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({ success: false, error: "Invalid payment parameters provided." });
      return;
    }

    // 1. Verify Razorpay signature using HMAC SHA-256
    const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature || ""
      );

    if (!isValid) {
      console.error("[Backend Payment Verification] Invalid signature for order:", razorpay_order_id);
      res.status(400).json({
        success: false,
        error: "Payment verification failed. Invalid digital signature.",
      });
      return;
    }
    // A valid callback signature proves authenticity, but live fulfilment must
    // also match the server-side order and a captured Razorpay payment.
    const storedPayment = await getPaymentByOrder(razorpay_order_id);
    if (!storedPayment) {
      res.status(404).json({ success: false, error: "Payment order was not found." });
      return;
    }
    const gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const gatewayAmount = Number(gatewayPayment.amount);
    if (gatewayPayment.order_id !== razorpay_order_id || gatewayPayment.status !== "captured" ||
        gatewayPayment.currency !== storedPayment.currency || gatewayAmount !== Math.round(storedPayment.amount * 100)) {
      console.error("[Backend Payment Verification] Gateway payment does not match the stored order", {
        orderId: razorpay_order_id, paymentId: razorpay_payment_id, status: gatewayPayment.status,
      });
      res.status(409).json({ success: false, error: "Payment is not captured or does not match this registration." });
      return;
    }

    // 2. Mark payment = PAID and registration = CONFIRMED atomically in database
    const confirmed = await confirmPaymentAndRegistration(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || ""
    );

    if (!confirmed) {
      res.status(404).json({
        success: false,
        error: "Registration record could not be located or updated.",
      });
      return;
    }

    const { registration, payment } = confirmed;
    const event = getEventBySlug(registration.eventSlug);
    const eventTitle = event?.title || registration.eventSlug;

    // The payment remains confirmed if SMTP is temporarily unavailable; a signed webhook can retry.
    let emailStatus: "sent" | "pending" = "sent";
    try { await sendReceiptIfNeeded(registration, payment); }
    catch (emailErr) { emailStatus = "pending"; console.error("[Backend Email Service] Receipt delivery failed:", emailErr); }

    // 4. Return success confirmation
    res.json({
      success: true,
      registrationId: registration.id,
      registrationCode: registration.registrationCode,
      paymentId: razorpay_payment_id,
      eventTitle,
      participantName: registration.name,
      amountPaid: payment.amount,
      emailStatus,
    });
  } catch (err: unknown) {
    console.error("[Backend Verify API Error]", err);
    res.status(500).json({
      success: false,
      error: "An unexpected error occurred while confirming payment.",
    });
  }
}

/**
 * POST /api/payments/webhook
 * Handles asynchronous server-to-server notifications from Razorpay.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const rawBody =
      (req as Request & { rawBody?: string }).rawBody ||
      (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    const signature = (req.headers["x-razorpay-signature"] as string) || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (webhookSecret) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("[Backend Razorpay Webhook] Invalid webhook signature received");
        res.status(400).json({ error: "Invalid webhook signature" });
        return;
      }
    } else {
      res.status(503).json({ error: "Webhook secret not configured" });
      return;
    }

    const eventData = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
    const eventType = eventData.event;
    console.log(`[Backend Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      const stored = orderId ? await getPaymentByOrder(orderId) : null;
      const amountMatches = stored && Number(paymentEntity?.amount) === Math.round(stored.amount * 100) && paymentEntity?.currency === stored.currency;
      if (orderId && paymentId && amountMatches) {
        const confirmed = await confirmPaymentAndRegistration(orderId, paymentId, signature);
        if (confirmed) await sendReceiptIfNeeded(confirmed.registration, confirmed.payment);
        console.log(`[Backend Razorpay Webhook] Confirmed payment ${paymentId} for order ${orderId}`);
      } else if (orderId && paymentId) console.error(`[Backend Razorpay Webhook] Rejected amount/currency mismatch for ${paymentId}`);
    } else if (eventType === "payment.failed") {
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await markPaymentFailed(orderId);
        console.log(`[Backend Razorpay Webhook] Marked payment failed for order ${orderId}`);
      }
    }

    res.json({ received: true });
  } catch (err: unknown) {
    console.error("[Backend Razorpay Webhook Error]", err);
    res.status(500).json({ error: "Internal webhook processing error" });
  }
}

/**
 * GET /api/payments/registration/:id
 * Retrieve registration and payment details by registration ID or code
 */
export async function getRegistration(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "Missing registration ID" });
      return;
    }

    const details = await getRegistrationDetails(id);
    if (!details) {
      res.status(404).json({ success: false, error: "Registration not found" });
      return;
    }

    res.json({ success: true, ...details });
  } catch (err: unknown) {
    console.error("[Backend Get Registration Error]", err);
    res.status(500).json({ success: false, error: "Failed to retrieve registration details" });
  }
}
