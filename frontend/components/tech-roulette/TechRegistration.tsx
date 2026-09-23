"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RegistrationModal from "@/components/registration/RegistrationModal";
import { getEventBySlug } from "@/lib/events";
import styles from "./tech-registration.module.css";

const configuredEvent = getEventBySlug("tech-roulette");
const event = configuredEvent ? { ...configuredEvent, accent: "#d6b47d" } : undefined;

export default function TechRegistration() {
  const router = useRouter();
  const closeRegistration = useCallback(() => router.push("/events/tech-roulette"), [router]);

  if (!event) return null;

  return (
    <main className={styles.page}>
      <header className={styles.guide}>
        <div className={styles.guideTop}>
          <Link href="/events/tech-roulette" className={styles.back}>← Back to event</Link>
          <span>PRAXIS / 2026</span>
        </div>
        <h1>Team leader registration</h1>
        <p>Sign in with Google before completing the form.</p>
      </header>
      <RegistrationModal event={event} isOpen onClose={closeRegistration} />
    </main>
  );
}
