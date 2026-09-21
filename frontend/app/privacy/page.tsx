import Link from "next/link";

export const metadata = { title: "Privacy Policy · Praxis 2026" };

const section = { marginTop: 28 } as const;

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#07090f", color: "#ece7df", padding: "64px 20px" }}>
      <article style={{ maxWidth: 760, margin: "0 auto", fontFamily: "Arial, sans-serif", lineHeight: 1.7 }}>
        <Link href="/" style={{ color: "#f0a34a" }}>← Praxis 2026</Link>
        <h1 style={{ fontSize: 42, margin: "28px 0 8px" }}>Privacy Policy</h1>
        <p style={{ color: "#aaa39a" }}>Effective: 21 September 2026</p>

        <section style={section}>
          <h2>Information we collect</h2>
          <p>Praxis 2026 collects the team leader&apos;s Google account name and email address, participant registration details, college details, contact information, verification status, and payment or transaction references needed to process an event registration.</p>
        </section>
        <section style={section}>
          <h2>How we use information</h2>
          <p>We use this information to authenticate the team leader, verify team members, calculate entry fees, process registrations and test or live payments, send verification messages, confirmations, and receipts, prevent abuse, and support event operations.</p>
        </section>
        <section style={section}>
          <h2>Service providers</h2>
          <p>Information may be processed by Google and Supabase for authentication, Supabase for database services, Cloudflare and Vercel for hosting, Razorpay for payments, and the configured email provider for transactional messages. Each provider processes data under its own terms and privacy policy.</p>
        </section>
        <section style={section}>
          <h2>Retention and security</h2>
          <p>Registration and payment records are retained for event administration, accounting, dispute handling, and security. Access is limited to authorized organizers and service accounts. No internet service can guarantee absolute security.</p>
        </section>
        <section style={section}>
          <h2>Your choices</h2>
          <p>You may ask the organizers to correct or delete eligible personal information. Some transaction and audit records may need to be retained for legal, accounting, or fraud prevention purposes.</p>
        </section>
        <section style={section}>
          <h2>Contact</h2>
          <p>For privacy questions, email <a href="mailto:joshichinmay848@gmail.com" style={{ color: "#f0a34a" }}>joshichinmay848@gmail.com</a>.</p>
        </section>
      </article>
    </main>
  );
}
