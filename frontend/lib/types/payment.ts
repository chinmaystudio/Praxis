/**
 * PRAXIS — Payment & Registration TypeScript Definitions
 */

export interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
  teamName?: string;
  teamSize?: number;
  teamMembers?: string[];
}

export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "cancelled";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled";

export interface CreateOrderRequest {
  eventSlug: string;
  registration: RegistrationFormData;
  // Any client-supplied amount must be ignored on server
  amount?: number;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  amount?: number; // in paise
  currency?: string;
  eventSlug?: string;
  eventTitle?: string;
  accent?: string;
  registrationId?: string;
  keyId?: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  registrationId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  registrationId?: string;
  registrationCode?: string; // e.g. PRX-8F3K21
  paymentId?: string;
  eventTitle?: string;
  participantName?: string;
  amountPaid?: number; // in INR
  error?: string;
}

export interface RegistrationRecord {
  id: string;
  registrationCode: string; // e.g. PRX-8F3K21
  eventId: string;
  eventSlug: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
  teamName?: string;
  teamSize?: number;
  teamMembers?: string[];
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  registrationId: string;
  eventId: string;
  eventSlug: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // in INR
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
