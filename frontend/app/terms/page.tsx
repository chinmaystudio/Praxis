import Link from "next/link";

export const metadata = { title: "Terms of Use · Praxis 2026" };

const section = { marginTop: 28 } as const;

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#07090f", color: "#ece7df", padding: "64px 20px" }}>
      <article style={{ maxWidth: 760, margin: "0 auto", fontFamily: "Arial, sans-serif", lineHeight: 1.7 }}>
        <Link href="/" style={{ color: "#f0a34a" }}>← Praxis 2026</Link>
        <h1 style={{ fontSize: 42, margin: "28px 0 8px" }}>Terms of Use</h1>
        <p style={{ color: "#aaa39a" }}>Effective: 21 September 2026</p>

        <section style={section}>
          <h2>Registration</h2>
          <p>Team leaders must provide accurate information and have permission to submit their teammates&apos; details. A registration is confirmed only after all required verification and payment steps are completed and a confirmation is issued.</p>
        </section>
        <section style={section}>
          <h2>Accounts and verification</h2>
          <p>The team leader uses a Google account to authenticate. Verification codes and registration access must not be shared with unauthorized people.</p>
        </section>
        <section style={section}>
          <h2>Payments</h2>
          <p>Applicable entry fees are shown before checkout and processed by Razorpay. Payment references may be retained for confirmation, support, accounting, and fraud prevention. Questions about cancellations or refunds must be directed to the event organizers.</p>
        </section>
        <section style={section}>
          <h2>Event participation</h2>
          <p>Participants must follow the published event rules, venue requirements, safety instructions, and organizer directions. Organizers may reject inaccurate or abusive registrations and may adjust schedules or event details when operationally necessary.</p>
        </section>
        <section style={section}>
          <h2>Availability</h2>
          <p>The service is provided for Praxis 2026 registration and may be updated or temporarily unavailable. Organizers are not responsible for interruptions caused by external networks or service providers.</p>
        </section>
        <section style={section}>
          <h2>Contact</h2>
          <p>For registration or terms questions, email <a href="mailto:joshichinmay848@gmail.com" style={{ color: "#f0a34a" }}>joshichinmay848@gmail.com</a>.</p>
        </section>
      </article>
    </main>
  );
}
