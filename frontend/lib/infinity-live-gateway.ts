import { supabaseBrowser } from "./supabase-browser";
import { RegistrationGateway, RegistrationDraft, EmailProof, PaymentReceipt } from "./infinity-registration";

async function authenticated() {
  const { data, error } = await supabaseBrowser().auth.getSession();
  if (error || !data.session?.user.email) throw new Error("Team leader must sign in with Google first.");
  return { token: data.session.access_token, email: data.session.user.email.toLowerCase() };
}
async function post(path: string, input: unknown) {
  const auth = await authenticated();
  const response = await fetch(`/api/infinity/${path}`, { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify(input) });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || "Registration request failed.");
  return body;
}
function checkoutScript(): Promise<void> {
  if (razorpayCtor()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load."));
    document.body.appendChild(script);
  });
}
type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type CheckoutCtor = new (options: Record<string, unknown>) => { open(): void };
function razorpayCtor(): CheckoutCtor | undefined {
  return (window as unknown as { Razorpay?: CheckoutCtor }).Razorpay;
}

export const liveGateway: RegistrationGateway = {
  mode: "live",
  async requestOtp(email) {
    const auth = await authenticated();
    const body = await post("otp/request", { leaderEmail: auth.email, email });
    return body.challenge;
  },
  async verifyOtp(challenge, code) {
    const auth = await authenticated();
    const body = await post("otp/verify", { leaderEmail: auth.email, challengeId: challenge.id, code });
    return body.proof;
  },
  async createPayment(draft: RegistrationDraft, proofs: EmailProof[]): Promise<PaymentReceipt> {
    const auth = await authenticated();
    if (auth.email !== draft.leaderEmail.toLowerCase()) throw new Error("Use the Google account matching the team leader email.");
    const order = await post("create-order", { draft, proofs });
    await checkoutScript();
    const RazorpayCheckout = razorpayCtor();
    if (!RazorpayCheckout || !order.keyId) throw new Error("Razorpay checkout is unavailable.");
    return new Promise((resolve, reject) => {
      const checkout = new RazorpayCheckout({ key: order.keyId, amount: order.amount,
        currency: "INR", order_id: order.orderId, name: "Praxis 2026",
        description: "Infinity Trials team entry", prefill: { email: draft.leaderEmail, contact: draft.phone },
        handler: async (payment: CheckoutResponse) => {
          try {
            const response = await fetch("/api/payments/verify", { method: "POST",
              headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
            const body = await response.json();
            if (!response.ok || !body.success) throw new Error(body.error || "Payment verification failed.");
            resolve({ id: body.paymentId, status: "paid", amount: body.amountPaid,
              currency: "INR", reference: body.registrationCode, emailStatus: body.emailStatus });
          } catch (error) { reject(error); }
        },
        modal: { ondismiss: () => reject(new Error("Payment checkout was closed.")) },
      });
      checkout.open();
    });
  },
  async submit({ draft, proofs, payment }) {
    const auth = await authenticated();
    if (auth.email !== draft.leaderEmail.toLowerCase()) throw new Error("Use the Google account matching the team leader email.");
    if (payment) {
      if (!payment.reference) throw new Error("A confirmed payment reference is required.");
      return { reference: payment.reference, mode: "live", emailStatus: payment.emailStatus || "pending", communityUrl: "https://chat.whatsapp.com/CRBxGduw0U8GG3x591hz8Q?s=qt&p=i&mlu=4&ilr=4" };
    }
    const body = await post("free", { draft, proofs });
    return { reference: body.reference, mode: "live", emailStatus: body.emailStatus, communityUrl: body.communityUrl || "https://chat.whatsapp.com/CRBxGduw0U8GG3x591hz8Q?s=qt&p=i&mlu=4&ilr=4" };
  },
};
