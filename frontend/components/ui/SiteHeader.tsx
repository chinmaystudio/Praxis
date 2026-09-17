"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

const NAV = ["Overview", "Universe", "Heroes", "Trailers", "Tickets"];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The website header + navigation. It doesn't exist during the Marvel intro —
 * it slides in as the camera exits the portal into the Hero, keyed off the
 * scroll-driven `signals.header`. It retires again as the horizontal timeline
 * begins so the cinematic back-half (reel → finale) stays immersive; the footer
 * carries the nav at the very end.
 */
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

  return (
    <header ref={ref} className={styles.header} style={{ opacity: 0, visibility: "hidden" }}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden />
        <span className={styles.brandText}>
          MARVEL<b>STUDIOS</b>
        </span>
      </div>
      <nav className={styles.nav}>
        {NAV.map((n) => (
          <a key={n} href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
            {n}
          </a>
        ))}
      </nav>
      <button className={styles.cta} type="button">
        Get Tickets
      </button>
    </header>
  );
}
