import type { Metadata } from "next";
import Link from "next/link";
import styles from "./closed.module.css";

export const metadata: Metadata = {
  title: "Research X Registration Closed | PRAXIS 2026",
  description: "Research X registrations are now closed.",
};

export default function ResearchXClosedPage() {
  return (
    <main className={styles.page}>
      <div className={styles.scanlines} aria-hidden="true" />
      <section className={styles.card} aria-labelledby="closed-title">
        <p className={styles.kicker}>PRAXIS 2026 · RESEARCH X</p>
        <p className={styles.status}>REGISTRATION CLOSED</p>
        <h1 id="closed-title">This research mission is complete.</h1>
        <p className={styles.copy}>
          Thank you for choosing Praxis. Research X registration has closed, but the
          experience does not end here—other events are still waiting for you.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/events">Explore other events</Link>
          <Link className={styles.secondary} href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
