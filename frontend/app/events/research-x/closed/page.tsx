import Link from "next/link";
import styles from "./closed.module.css";

export const metadata = {
  title: "Research X Registration Closed | Praxis 2026",
  description: "Research X registration is closed. Explore the remaining Praxis 2026 events.",
};

export default function ResearchXRegistrationClosedPage() {
  return <main className={styles.page}>
    <div className={styles.scanlines} aria-hidden />
    <section className={styles.card} aria-labelledby="closed-title">
      <p className={styles.kicker}>PRAXIS 2026 · RESEARCH X</p>
      <span className={styles.status}>REGISTRATION CLOSED</span>
      <h1 id="closed-title">Research X<br />registration is <em>closed.</em></h1>
      <p className={styles.copy}>Thank you for your interest in Research X. Registration has closed. Explore the other Praxis 2026 events to find your next challenge.</p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/events">Explore other events <span aria-hidden>→</span></Link>
        <Link className={styles.secondary} href="/">Return home</Link>
      </div>
    </section>
  </main>;
}
