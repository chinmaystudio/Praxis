import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

/**
 * Verify Razorpay payment signature using HMAC SHA-256
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  receivedSignature: string
): boolean {
  if (!keySecret) {
    console.error("[Razorpay] Missing RAZORPAY_KEY_SECRET for signature verification");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(receivedSignature, "utf-8")
    );
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  webhookSecret: string
): boolean {
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(receivedSignature, "utf-8")
    );
  } catch {
    return false;
  }
}
