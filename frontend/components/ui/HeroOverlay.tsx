"use client";

import { useRef } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import { VIDEO } from "@/lib/constants";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

/**
 * Hero-section chrome over the scrubbed Doom trailer: a kicker + line (NOT the
 * reserved title), a live scrub bar that fills with the trailer's scroll
 * position, and an "Explore Events" CTA that navigates to the full orbit page.
 */
export default function HeroOverlay() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useRaf(() => {
    const el = wrapRef.current;
    if (!el) return;
    const h = signals.heroOp; // the hero chrome rides in with the video itself
    el.style.opacity = h.toFixed(3);
    el.style.visibility = h < 0.01 ? "hidden" : "visible";
    if (barRef.current) {
      const p = Math.min(1, Math.max(0, signals.heroT / VIDEO.heroDur));
      barRef.current.style.transform = `scaleX(${p.toFixed(3)})`;
    }
  });

  return (
    <div ref={wrapRef} className={styles.heroUi} style={{ opacity: 0 }} aria-hidden>
      <div className={styles.heroText}>
        <span className={styles.heroKicker}>Phase 01 · Marvel Studios</span>
      </div>

      <div className={styles.heroScrub}>
        <span className={styles.heroScrubLabel}>Scroll to play the trailer</span>
        <span className={styles.scrubTrack}>
          <span ref={barRef} className={styles.scrubFill} />
        </span>
      </div>

      {/* "Explore Events" CTA — navigates to the infinite orbit page */}
      <Link
        href="/events"
        className={styles.exploreBtn}
        aria-label="Explore Events"
        aria-hidden={false}
        style={{ pointerEvents: "auto" }}
      >
        <span className={styles.exploreBtnIcon} aria-hidden />
        Explore Events
        <span className={styles.exploreBtnArrow} aria-hidden>→</span>
      </Link>
    </div>
  );
}
