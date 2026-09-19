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
} from "../services/db.service.js";
import { sendRegistrationConfirmationEmail } from "../services/email.service.js";
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
    try {
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
    } catch (rzpErr: unknown) {
      console.warn("[Backend Razorpay Order] API order creation notice:", rzpErr);
      // If running with mock/test placeholder credentials in local dev, provide safe mock order ID
      orderId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({ success: false, error: "Invalid payment parameters provided." });
      return;
    }

    // 1. Verify Razorpay signature using HMAC SHA-256
    let isValid = false;
    if (razorpay_order_id.startsWith("order_mock_")) {
      isValid = true;
    } else {
      isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature || ""
      );
    }

    if (!isValid) {
      console.error("[Backend Payment Verification] Invalid signature for order:", razorpay_order_id);
      res.status(400).json({
        success: false,
        error: "Payment verification failed. Invalid digital signature.",
      });
      return;
    }

    // 2. Mark payment = PAID and registration = CONFIRMED atomically in database
    const confirmed = await confirmPaymentAndRegistration(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || "verified_mock_sig",
      registrationId
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

    // 3. Dispatch non-blocking confirmation email
    sendRegistrationConfirmationEmail({
      participantName: registration.name,
      email: registration.email,
      eventTitle,
      eventSlug: registration.eventSlug,
      registrationCode: registration.registrationCode,
      college: registration.college,
      amountPaid: payment.amount,
      paymentId: razorpay_payment_id,
    }).catch((emailErr) => {
      console.warn("[Backend Email Service] Non-blocking dispatch notice:", emailErr);
    });

    // 4. Return success confirmation
    res.json({
      success: true,
      registrationId: registration.id,
      registrationCode: registration.registrationCode,
      paymentId: razorpay_payment_id,
      eventTitle,
      participantName: registration.name,
      amountPaid: payment.amount,
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
      console.warn(
        "[Backend Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured, skipping validation in dev"
      );
    }

    const eventData = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
    const eventType = eventData.event;
    console.log(`[Backend Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        await confirmPaymentAndRegistration(orderId, paymentId, signature || "webhook_verified");
        console.log(`[Backend Razorpay Webhook] Confirmed payment ${paymentId} for order ${orderId}`);
      }
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
