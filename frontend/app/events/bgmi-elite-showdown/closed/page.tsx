import Link from "next/link";
import styles from "./closed.module.css";

export const metadata = {
  title: "BGMI Registration Closed | Praxis 2026",
  description: "BGMI Elite Showdown registration is closed. Explore the remaining Praxis 2026 events.",
};

export default function BgmiRegistrationClosedPage() {
  return <main className={styles.page}>
    <div className={styles.scanlines} aria-hidden />
    <section className={styles.card} aria-labelledby="closed-title">
      <p className={styles.kicker}>PRAXIS 2026 · BGMI ELITE SHOWDOWN</p>
      <span className={styles.status}>REGISTRATION CLOSED</span>
      <h1 id="closed-title">This battleground<br />is <em>locked.</em></h1>
      <p className={styles.copy}>Thank you for choosing Praxis. BGMI registration has closed, but the experience does not end here—other events are still waiting for you.</p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/events">Explore other events <span aria-hidden>→</span></Link>
        <Link className={styles.secondary} href="/">Return home</Link>
      </div>
    </section>
  </main>;
}
