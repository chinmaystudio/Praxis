import type { Metadata } from "next";
import Link from "next/link";
import styles from "./closed.module.css";

export const metadata: Metadata = {
  title: "Infinity Trials Registration Closed | PRAXIS 2026",
  description: "Infinity Trials registrations are now closed.",
};

export default function InfinityTrialsClosedPage() {
  return (
    <main className={styles.page}>
      <div className={styles.scanlines} aria-hidden="true" />
      <section className={styles.card} aria-labelledby="closed-title">
        <p className={styles.kicker}>PRAXIS 2026 · INFINITY TRIALS</p>
        <p className={styles.status}>REGISTRATION CLOSED</p>
        <h1 id="closed-title">The alliance is assembled.</h1>
        <p className={styles.copy}>
          Thank you for your interest in Infinity Trials. Registration has closed.
          Explore the other Praxis 2026 events to find your next challenge.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/events">Explore other events</Link>
          <Link className={styles.secondary} href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
