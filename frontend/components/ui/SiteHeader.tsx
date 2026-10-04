"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

export default function SiteHeader({ cinematic = true, sponsorsActive = false, teamActive = false, galleryActive = false }: { cinematic?: boolean; sponsorsActive?: boolean; teamActive?: boolean; galleryActive?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useRaf(() => {
    if (!cinematic) return;
    const el = ref.current;
    if (!el) return;
    // Keep the primary navigation available throughout the homepage experience.
    const h = signals.header;
    el.style.opacity = h.toFixed(3);
    el.style.transform = `translateY(${(1 - h) * -20}px)`;
    el.style.pointerEvents = h > 0.6 ? "auto" : "none";
    el.style.visibility = h < 0.01 ? "hidden" : "visible";
  });

  return (
    <header ref={ref} className={styles.header} style={{ opacity: 1 }}>
      {/* Left: Pure Praxis Banner Logo (Large, no extra text) */}
      <Link href="/"
          className={styles.brand}
          onClick={cinematic ? (event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined}
          aria-label="Praxis Home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
            src="/images/praxis-banner.png?v=4"
            alt="PRAXIS"
            className={styles.brandLogo}
        />
      </Link>

      <nav className={styles.headerNav} aria-label="Main navigation">
      <Link href="/gallery" className={styles.sponsorsBtn} aria-current={galleryActive ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 5-5 4 4 3-3 6 6" /></svg>
        <span>GALLERY</span>
      </Link>
      <Link href="/team" className={styles.sponsorsBtn} aria-current={teamActive ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" /></svg>
        <span>TEAM</span>
      </Link>
      <Link href="/sponsors" className={styles.sponsorsBtn} aria-current={sponsorsActive ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9Z" /></svg>
        <span>SPONSORS</span>
      </Link>
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
      <button
        type="button"
        className={`${styles.mobileMenuBtn} ${mobileOpen ? styles.mobileMenuBtnOpen : ""}`}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      </nav>
      <div id="mobile-navigation" className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ""}`}>
        <Link href="/" onClick={() => setMobileOpen(false)}>Home <span>01</span></Link>
        <Link href="/gallery" aria-current={galleryActive ? "page" : undefined} onClick={() => setMobileOpen(false)}>Gallery <span>02</span></Link>
        <Link href="/team" aria-current={teamActive ? "page" : undefined} onClick={() => setMobileOpen(false)}>Team <span>03</span></Link>
        <Link href="/sponsors" aria-current={sponsorsActive ? "page" : undefined} onClick={() => setMobileOpen(false)}>Sponsors <span>04</span></Link>
      </div>
    </header>
  );
}
