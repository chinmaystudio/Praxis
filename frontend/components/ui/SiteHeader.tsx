"use client";

import { useRef } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function SiteHeader() {
  const ref = useRef<HTMLElement>(null);

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    const h = signals.header * (1 - smoothstep(0.02, 0.14, signals.reel));
    el.style.opacity = h.toFixed(3);
    el.style.transform = `translateY(${(1 - h) * -20}px)`;
    el.style.pointerEvents = h > 0.6 ? "auto" : "none";
    el.style.visibility = h < 0.01 ? "hidden" : "visible";
  });

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header ref={ref} className={styles.header} style={{ opacity: 0, visibility: "hidden" }}>
      {/* Left: Pure Praxis Banner Logo (Large, no extra text) */}
      <div
          className={styles.brand}
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          aria-label="Praxis Home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
            src="/images/praxis-banner.png?v=4"
            alt="PRAXIS"
            className={styles.brandLogo}
        />
      </div>

      {/* Right: Unique, Attractive Cyber Sci-Fi Register Button */}
      <Link
          href="/events"
          className={styles.registerBtn}
          aria-label="View Praxis events"
      >
          <span className={styles.btnScanline} aria-hidden />
          <span className={styles.btnCornerTL} aria-hidden />
          <span className={styles.btnCornerBR} aria-hidden />
          <span className={styles.btnDot} aria-hidden />
          <span className={styles.btnLabel}>REGISTER</span>
          <svg
            className={styles.btnArrow}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
      </Link>
    </header>
  );
}
