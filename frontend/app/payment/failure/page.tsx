"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../payment.module.css";

function FailureContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Payment authorization could not be completed.";
  const eventSlug = searchParams.get("event") || "";

  return (
    <div className={`${styles.container} ${styles.failure}`}>
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          ✕
        </div>

        <div className={styles.kicker}>TRANSACTION UNCOMPLETED</div>
        <h1 className={styles.title}>PAYMENT FAILED</h1>
        <p className={styles.description}>
          Your payment could not be completed. No registration fee has been captured, and no event slot has been confirmed.
        </p>

        <div className={styles.detailsBox}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Reason</span>
            <span className={styles.detailValue} style={{ color: "#ff6b76" }}>
              {reason}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.detailValue} style={{ color: "#ff4458" }}>
              NOT CHARGED
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/events" className={styles.primaryBtn}>
            Try Again ⟳
          </Link>
          <Link href="/events" className={styles.secondaryBtn}>
            Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className={`${styles.container} ${styles.failure}`}><div className={styles.card}>Loading status...</div></div>}>
      <FailureContent />
    </Suspense>
  );
}
