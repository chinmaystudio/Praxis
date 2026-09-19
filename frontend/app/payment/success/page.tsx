"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getEventBySlug } from "@/lib/events";
import styles from "../payment.module.css";

function SuccessContent() {
  const searchParams = useSearchParams();
  const regCode = searchParams.get("reg") || "PRX-CONFIRMED";
  const eventSlug = searchParams.get("event") || "";
  const paymentId = searchParams.get("pay") || "pay_verified";

  const event = getEventBySlug(eventSlug);
  const eventTitle = event?.title || (eventSlug ? eventSlug.toUpperCase().replace(/-/g, " ") : "PRAXIS EVENT");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          ✓
        </div>

        <div className={styles.kicker}>PRAXIS 2026 // CONFIRMED</div>
        <h1 className={styles.title}>PAYMENT SUCCESSFUL</h1>
        <p className={styles.description}>
          Your official registration for <strong>{eventTitle}</strong> has been received and verified.
          A confirmation record has been logged in the intelligence registry.
        </p>

        <div className={styles.detailsBox}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Registration ID</span>
            <span className={styles.registrationCodeBadge}>{regCode}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Event</span>
            <span className={styles.detailValue}>{eventTitle}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Transaction ID</span>
            <span className={styles.detailValue}>{paymentId}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.detailValue} style={{ color: "#00ff9c" }}>
              PAID & CONFIRMED
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/events" className={styles.primaryBtn}>
            Return to Events ↗
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Praxis Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.card}>Loading confirmation...</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
